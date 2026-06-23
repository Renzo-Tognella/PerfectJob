# Brief: ai-resume-generator

## Problem

Candidates need tailored resumes for each job they apply to, but manually adapting a resume is time-consuming and error-prone. PerfectJob already stores rich candidate profile data (skills, experience, education, languages, headline, bio). The platform should leverage this data plus the job's requirements to generate a polished, job-specific PDF resume using a fixed LaTeX template.

The existing Application system (entity, controller, service, endpoints, mobile tab, admin tracking) is being fully replaced by this resume generation flow.

## Current State

- **Profile data**: Complete. `User` entity has headline, bio, location, yearsExperience, skills, linkedin/github URLs, resumeText. Sub-entities: `UserExperience`, `UserEducation`, `UserLanguage`. `ProfileService.toResponse()` assembles full `ProfileResponse`.
- **CV analyzer**: `service/resume/ResumeAnalyzer.java` (631 lines, regex/dictionary parser, NO LLM) + `PdfTextExtractor.java` (PDFBox 3). These are for **intake** (PDF→profile), not generation. They stay untouched.
- **Application system**: `Application.java`, `ApplicationController.java`, `ApplicationService.java` — to be **deleted entirely**.
- **LLM deps**: Zero. No LangChain4j, no Spring AI, no OpenAI client in pom.xml.
- **LaTeX toolchain**: None. No tectonic/texlive anywhere.
- **AI config**: No API keys or AI-related env vars exist.
- **Migrations**: Latest = V8. This spec creates V10 (combined: create `resumes` table + drop `applications` table). V9 is reserved for `job-external-url` (external_url column). Coordinate if merge order changes.

## Desired Outcome

- POST `/v1/resumes` with `{jobId}` triggers: load user profile + job → LLM generates tailored content (JSON) → Java fills LaTeX template → tectonic compiles to PDF → store result → return resume metadata.
- GET `/v1/resumes` lists the candidate's generated resumes (each linked to a job).
- GET `/v1/resumes/{id}` returns resume details + the associated job description.
- GET `/v1/resumes/{id}/pdf` streams the PDF file.
- DELETE `/v1/resumes/{id}` removes a generated resume.
- The Application entity, controller, service, and all references are deleted. The `applications` table is dropped.
- Recruiter admin endpoints for applications are removed.

## Approach

**Hybrid LLM→JSON→LaTeX→PDF pipeline:**

1. **LLM integration**: LangChain4j core deps (`langchain4j-open-ai`, not the Spring Boot starter) with manual `@Configuration`. `OpenAiChatModel` configured with `baseUrl("https://openrouter.ai/api/v1")`, model `deepseek/deepseek-chat`, API key from `OPENROUTER_API_KEY` env var.

2. **Structured generation**: Use LangChain4j `AiServices` with a typed return interface (e.g., `TailoredResumeContent` record) to get structured JSON from the LLM. Validate the response with a parser; fall back to retry on malformed output.

3. **LaTeX template builder**: Java class that takes `TailoredResumeContent` + `ProfileResponse` and produces a complete `.tex` string using the user-provided template structure (documentclass, cvsection, job, company, simpleline commands). Template structure is hardcoded in Java (string builder / text blocks), NOT in the LLM prompt. The LLM only provides content, never LaTeX syntax.

4. **PDF compilation**: Tectonic static binary invoked via `ProcessBuilder` from Java. Input: `.tex` file (temp). Output: `.pdf` file (temp). Store the PDF (filesystem or DB bytea — see constraints).

5. **Storage**: `Resume` entity (`resumes` table): `id, userId, jobId, pdfStoragePath, latexSource (TEXT), createdAt`. PDF stored on filesystem under a configurable directory (e.g., `data/resumes/{userId}/{resumeId}.pdf`).

6. **Application removal**: Delete `Application.java`, `ApplicationController.java`, `ApplicationService.java`, `ApplicationSubmittedEvent`, related DTOs. Migration drops `applications` table.

## Scope

- **In**:
  - pom.xml: add `langchain4j` + `langchain4j-open-ai` (core deps, no starter)
  - Dockerfile / start.sh: install tectonic static binary, warm font cache
  - Config: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_BASE_URL` env vars + application.yml namespace
  - `service/ai/` or `service/resume/generate/`: `ResumeGenerationService`, `LatexTemplateBuilder`, `TectonicPdfCompiler`, `ResumeContentAiService` (LangChain4j AiServices interface)
  - `model/Resume.java` + `repository/ResumeRepository.java`
  - `controller/v1/ResumeController.java` + DTOs
  - Migration: create `resumes` table + drop `applications` table
  - Delete: `Application.java`, `ApplicationController.java`, `ApplicationService.java`, `ApplicationSubmittedEvent`, `SubmitApplicationRequest` DTO
  - `.env.example`: add new env vars
- **Out**:
  - Multiple resume templates (single fixed template)
  - Resume editing after generation (regenerate instead)
  - Streaming generation progress (synchronous for now)
  - Batch generation
  - Resume scoring / matching against job
  - Changes to profile endpoints or profile data model
  - Changes to the existing CV analyzer (`ResumeAnalyzer`, `PdfTextExtractor`)

## Boundary Candidates

- **Generation pipeline** (LLM call + LaTeX + PDF): self-contained in `service/resume/generate/` or `service/ai/`. Input: `ProfileResponse` + `Job`. Output: `byte[]` PDF + `String` latexSource.
- **REST API layer**: `ResumeController` is thin — delegates to `ResumeService` which orchestrates generation + storage.
- **Storage seam**: PDF persistence is behind an interface (`ResumePdfStorage`) so filesystem/S3/DB can be swapped.
- **Application deletion**: Clean removal of Application entity + cascade. No data migration (academic project, no production data).

## Out of Boundary

- Mobile UI (Spec: mobile-resume-experience)
- Job external URL (Spec: job-external-url — independent)
- Profile data model changes (profile is read-only input)
- Existing CV analyzer modifications
- Recruiter admin UI changes (admin loses application tracking — academic scope)

## Upstream / Downstream

- **Upstream**: 
  - `ProfileService` / `ProfileResponse` (read-only — provides candidate data)
  - `JobService` / `Job` entity (read-only — provides job requirements, skills, description)
  - `job-external-url` spec (independent, but resume generation can include the URL in context if available)
- **Downstream**:
  - `mobile-resume-experience` spec (consumes the `/v1/resumes` API)

## Existing Spec Touchpoints

- **Extends**: none
- **Adjacent**: 
  - `job-external-url` (both touch `JobResponse` DTO — coordinate field additions)
  - Existing `service/resume/` package (analyzer stays, generator is a sibling)

## Constraints

- **Spring Boot 3.3.5**: LangChain4j starter requires 3.5+. Use core deps with manual `@Bean` wiring. Do NOT upgrade Spring Boot.
- **LaTeX template**: Fixed structure based on the user-provided template (documentclass article, helvet, custom commands `\cvsection`, `\job`, `\company`, `\simpleline`, `cvcontent` environment). The LLM NEVER produces LaTeX — only structured content JSON.
- **Tectonic**: Static binary for x86_64 Linux. Must be installed in the Docker image. First run downloads font bundle — warm the cache during Docker build or handle gracefully.
- **OpenRouter + DeepSeek**: API key required. No guaranteed JSON mode via OpenRouter for DeepSeek — use strong system prompt + LangChain4j response parsing + retry on malformed output.
- **PDF storage**: Filesystem under configurable directory (default `data/resumes/`). Path stored in DB. Directory must be created on startup.
- **Synchronous generation**: The POST endpoint blocks until PDF is ready. Acceptable for academic scope. (Future: async with notification.)
- **No PII leakage**: The LLM receives profile data (name, experience, etc.) — this is intentional (it's generating the user's resume). Document this in the privacy/consent flow.
- **Product copy**: Portuguese (pt-BR) for generated resume content prompt. English for code/logs.
- **Migration coordination**: V9 is reserved for `job-external-url`. This spec uses V10 (combined: create `resumes` + drop `applications` in one migration).
