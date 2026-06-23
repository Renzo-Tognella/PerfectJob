# Roadmap

## Overview

PerfectJob is pivoting its candidate-facing flow from "submit application" to "generate tailored resume". Instead of applying to jobs through the platform, candidates generate an AI-tailored PDF resume adapted to each specific job, using their profile data (skills, experience, education, languages) and the job's requirements. The generated resume follows a fixed LaTeX template and is compiled to PDF server-side via tectonic.

Additionally, the job ingestion pipeline must capture and expose the external job URL so candidates can apply directly on the original platform (Remotive, Arbeitnow).

The existing Application system (entity, endpoints, mobile screen, admin tracking) is fully replaced by a Resume entity and generation flow.

## Approach Decision

- **Chosen**: Hybrid LLM→JSON→LaTeX template→tectonic pipeline
  - LLM (DeepSeek via OpenRouter, integrated via LangChain4j core deps) generates **structured JSON** containing tailored resume content (summary bullet points, skill emphasis, experience highlights adapted to the target job)
  - Java code deterministically maps the JSON into the fixed LaTeX template (the user-provided template structure)
  - Tectonic compiles the filled LaTeX to PDF server-side
  - PDF is stored and associated with the user + job
- **Why**: Separates LLM content generation (where it excels) from LaTeX rendering (where determinism matters). The LLM cannot break the LaTeX syntax. Template fidelity is exact.
- **Rejected alternatives**:
  - Direct LLM→LaTeX: LLM may produce invalid LaTeX, break compilation, hallucinate commands. Too fragile.
  - HTML→PDF (OpenHTMLtoPDF): No LaTeX toolchain needed, but visual output wouldn't match the user's template. User explicitly wanted LaTeX.

## Scope

- **In**:
  - Add `external_url` to jobs (ingestion captures it, API exposes it, mobile displays it)
  - AI resume generation backend (LangChain4j + OpenRouter/DeepSeek + LaTeX template + tectonic PDF compilation)
  - Resume entity, storage, REST API (replace Application system entirely)
  - Mobile UI rework: "Candidaturas" tab → "Currículos", apply button → generate resume, PDF preview, job link
- **Out**:
  - Recruiter application tracking (removed — academic scope decision)
  - Multi-language resume generation (PT-BR only for now)
  - Resume templates (single fixed template; no template picker)
  - Spring Boot upgrade (stay on 3.3.5; use LangChain4j core deps, not starter)
  - Email delivery of resumes
  - Resume versioning / diffing between generations

## Constraints

- **Spring Boot 3.3.5**: LangChain4j Spring Boot starter requires 3.5+. Use `langchain4j-open-ai` core dependency with manual `@Configuration` bean wiring (no auto-config starter).
- **Java 21**: LangChain4j requires 17+. Satisfied.
- **LaTeX toolchain**: Tectonic static binary (MIT license) installed in Docker image. First-run downloads font bundle — must warm the cache during Docker build.
- **LLM provider**: OpenRouter (OpenAI-compatible API at `https://openrouter.ai/api/v1`) with DeepSeek model. Needs `OPENROUTER_API_KEY` env var. Structured output via prompt engineering + response validation (no guaranteed JSON mode through OpenRouter for DeepSeek).
- **Flyway migrations**: Append-only. Next migration = V9. Never edit merged migrations.
- **ddl-auto: none**: All schema changes must be explicit Flyway migrations.
- **Product copy**: Portuguese (pt-BR) for UI, English for code.
- **Docker image**: `maven:3.9-eclipse-temurin-21` (Debian-based) — tectonic static binary is compatible.

## Boundary Strategy

- **Why this split**: The three specs have clean seams — (1) job URL is a data-plumbing change independent of resume generation, (2) the generation backend is a self-contained subsystem with a well-defined REST contract, (3) the mobile UI consumes that contract. Specs 1 and 2 can be developed in parallel; Spec 3 depends on Spec 2's API.
- **Shared seams to watch**:
  - `JobResponse` DTO: modified by Spec 1 (add url) and consumed by Spec 2 (generation input) and Spec 3 (display). Coordinate the DTO shape.
  - `ProfileResponse` / user profile data: read-only input for Spec 2. No changes to profile endpoints.
  - Application deletion (Spec 2): must happen atomically with Resume entity creation. The V-migration that drops `applications` must also create `resumes` in the same transaction.
  - Mobile navigation types (Spec 3): `TabParamList` and `MainStackParamList` change when renaming the tab and adding PDF preview route.

## Specs (dependency order)

- [x] job-external-url -- Add external URL to jobs (ingestion, schema, API response, admin form). Dependencies: none
- [x] ai-resume-generator -- LangChain4j + LaTeX + tectonic + Resume entity + API + drop Application system. Dependencies: none (profile data already exists; job-url spec is independent)
- [x] mobile-resume-experience -- Rename Candidaturas tab to Currículos, replace apply button with generate-resume, add PDF preview screen, display job external link (incl. mobile `externalUrl` types/mapper). Dependencies: ai-resume-generator (needs /v1/resumes endpoints), job-external-url (needs JobResponse.externalUrl in API)
