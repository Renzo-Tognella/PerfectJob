# Research & Design Decisions

---
**Purpose**: Capture discovery findings, architectural investigations, and rationale that inform the technical design.

---

## Summary
- **Feature**: `ai-resume-generator`
- **Discovery Scope**: Complex Integration (new LLM subsystem + existing entity removal + external toolchain)
- **Key Findings**:
  - LangChain4j Spring Boot starter requires Spring Boot 3.5+; this project is on 3.3.5, so core deps with manual bean wiring are mandatory.
  - Tectonic ships a static x86_64 Linux binary (MIT license) that works in the `maven:3.9-eclipse-temurin-21` Docker image; first-run downloads a font bundle that must be warmed during build.
  - OpenRouter exposes an OpenAI-compatible API (`https://openrouter.ai/api/v1`) usable with `OpenAiChatModel`; DeepSeek's `deepseek/deepseek-chat` has no guaranteed JSON mode through OpenRouter, so structured output must rely on prompt engineering + LangChain4j `AiServices` typed interface + response validation + retry.
  - The existing `ProfileService.toResponse()` already assembles a complete `ProfileResponse` (skills, experiences, education, languages) — the generation pipeline consumes it read-only.
  - The `Application` system is deeply referenced: `ProfileService` counts applications for `applicationsCount`, `NotificationService` sends application-status notifications, `ApplicationSubmittedEvent` fires on submit. All references must be cleaned during removal.

## Research Log

### LangChain4j Dependency Strategy
- **Context**: Project runs Spring Boot 3.3.5; LangChain4j's `langchain4j-spring-boot-starter` requires Spring Boot 3.5+.
- **Sources Consulted**: LangChain4j GitHub (`pom.xml`, README), Maven Central artifact metadata.
- **Findings**:
  - `dev.langchain4j:langchain4j-open-ai` (core dep) pulls no Spring auto-configuration — safe to use on SB 3.3.5.
  - `dev.langchain4j:langchain4j` (core) provides `AiServices`, `SystemMessage`, `UserMessage`, structured-output proxies.
  - Manual `@Bean` wiring of `OpenAiChatModel` + `AiServices.builder(...)` is the documented approach when the starter cannot be used.
  - Latest stable LangChain4j version line compatible with Java 21: 1.x (e.g. `1.0.1` or `1.1.0`).
- **Implications**: Add two Maven properties (`langchain4j.version`) and two `<dependency>` entries; create a `LangChain4jConfig` class with `@Bean OpenAiChatModel` and `@Bean ResumeContentAiService`.

### OpenRouter + DeepSeek Structured Output
- **Context**: Need structured JSON (tailored summary + bullet points + skill emphasis) from the LLM; OpenRouter/DeepSeek has no guaranteed JSON mode.
- **Sources Consulted**: OpenRouter API docs, LangChain4j `AiServices` structured-output docs, DeepSeek API docs.
- **Findings**:
  - `AiServices.builder(ResumeContentAiService.class).chatLanguageModel(model).build()` returns a proxy that appends JSON-schema-style instructions to the prompt and parses the LLM response into the typed return.
  - DeepSeek follows `system` + `user` messages well and produces JSON when instructed with a clear schema and few-shot example.
  - `OpenAiChatModel` builder accepts `baseUrl("https://openrouter.ai/api/v1")` — OpenRouter is OpenAI-compatible.
  - Response parsing failures throw a LangChain4j runtime exception; the service layer must catch and retry (max 2 attempts) before surfacing a user-facing error.
- **Implications**: Define `ResumeContentAiService` interface returning `TailoredResumeContent` record; implement retry in `ResumeGenerationService`; include a pt-BR system prompt with the JSON schema.

### Tectonic Integration
- **Context**: Need server-side LaTeX→PDF compilation without a full TeX Live install.
- **Sources Consulted**: Tectonic GitHub releases, Docker integration guides, MIT license text.
- **Findings**:
  - Tectonic provides a statically-linked `x86_64-unknown-linux-musl` binary download (`tectonic-*.tar.gz`) with no runtime dependencies.
  - Invocation: `tectonic --outdir <out> <input.tex>` produces `<input>.pdf` in the output directory.
  - First run downloads a font/asset bundle (~300 MB) cached under `~/.cache/Tectonic/`; this must be warmed during Docker build or the first PDF generation will be slow.
  - Exit codes: 0 = success, non-zero = compilation error (stderr contains LaTeX errors).
  - The binary path should be configurable (default `/usr/local/bin/tectonic`) so host Java (dev) and Docker (prod) can both resolve it.
- **Implications**: `TectonicPdfCompiler` writes `.tex` to a temp dir, runs `ProcessBuilder`, reads the PDF bytes, checks exit code, and surfaces a typed exception on failure. `start.sh` must install + warm tectonic.

### Application System Coupling Analysis
- **Context**: Removing `Application` touches multiple subsystems; need to find all references.
- **Sources Consulted**: Codebase grep for `Application`, `applicationRepository`, `ApplicationSubmittedEvent`.
- **Findings**:
  - `ProfileService.toResponse()` calls `applicationRepository.countByCandidateId(userId)` for `applicationsCount`.
  - `ApplicationService` calls `notificationService.createForCandidate(...)` and `notificationService.notifyApplicationStatusChange(...)`.
  - `ApplicationSubmittedEvent` is published but no `@EventListener` exists for it in the codebase (dead event).
  - `ApplicationMapper` is a pure static mapper.
  - `ApplicationStatus` enum is used only by `ApplicationService.updateStatus`.
  - `UpdateApplicationStatusRequest` DTO is used only by `ApplicationController.updateStatus`.
- **Implications**: Removal must update `ProfileService` (drop `applicationRepository` field + `applicationsCount` computation), delete `ApplicationSubmittedEvent`, `ApplicationStatus`, `UpdateApplicationStatusRequest`, `ApplicationMapper`, `ApplicationRepository`. The `ProfileResponse` record loses `applicationsCount`; coordinate with mobile/admin consumers (out of this spec's code boundary — documented as adjacent impact).

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Direct LLM→LaTeX | LLM produces full `.tex` directly | Single step | LLM can break LaTeX syntax; compilation failures; hard to debug | Rejected — too fragile |
| LLM→JSON→Java LaTeX Builder | LLM produces structured JSON; Java fills a hardcoded template | Deterministic LaTeX; LLM cannot break compilation; testable template builder | Two-step pipeline; JSON parsing can fail | **Selected** |
| HTML→PDF (OpenHTMLtoPDF) | Render HTML resume to PDF | No LaTeX toolchain needed | Cannot match user's LaTeX template; user explicitly wanted LaTeX | Rejected |

## Design Decisions

### Decision: LangChain4j Core Deps (not starter)
- **Context**: Spring Boot 3.3.5 incompatible with `langchain4j-spring-boot-starter` (requires 3.5+).
- **Alternatives Considered**:
  1. Upgrade Spring Boot to 3.5+ — rejected (risks breaking existing app, out of scope).
  2. Spring AI — rejected (adds another framework, heavier, no OpenRouter convenience).
  3. Raw HTTP client to OpenRouter — rejected (loses structured-output proxy, retry, message building).
- **Selected Approach**: `langchain4j-open-ai` + `langchain4j` core deps with manual `@Configuration` bean wiring.
- **Rationale**: Minimal footprint, no auto-config conflicts, structured-output proxy via `AiServices` works on any Spring Boot version.
- **Trade-offs**: Manual bean wiring (vs auto-config) — acceptable for a single model + single service interface.

### Decision: Single V10 Migration (create resumes + drop applications)
- **Context**: `job-external-url` spec claims V9; this spec needs a migration too.
- **Alternatives Considered**:
  1. V10 create resumes + V11 drop applications — unnecessary split.
  2. V10 combined — atomic, cleaner.
- **Selected Approach**: Single `V10__add_resumes_drop_applications.sql` that creates the `resumes` table and drops the `applications` table.
- **Rationale**: Both changes are part of the same feature pivot; keeping them atomic avoids a transient state where neither table matches the code.
- **Trade-offs**: `job-external-url` must merge first to claim V9, or this spec's migration is renumbered at merge time.

### Decision: PDF Storage on Filesystem
- **Alternatives Considered**: DB bytea, S3.
- **Selected Approach**: Filesystem under configurable `perfectjob.resume.storage-dir` (default `data/resumes/{userId}/{resumeId}.pdf`), path stored in DB.
- **Rationale**: Simplest for academic scope; no S3 setup; avoids bloating the DB; directory created on app startup.

### Decision: Synchronous Generation
- **Selected Approach**: POST `/v1/resumes` blocks until PDF is ready.
- **Rationale**: Academic scope; single user; acceptable latency (~10–30s for LLM + compile). Async with notification is a future enhancement.

## Risks & Mitigations
- **LLM returns malformed JSON** — Mitigation: strong system prompt with schema + few-shot example, LangChain4j `AiServices` parsing, max-2 retry loop, user-facing error on final failure.
- **Tectonic not installed on dev host** — Mitigation: configurable binary path; clear error message guiding installation; `start.sh` handles Docker install.
- **Font cache cold start** — Mitigation: warm tectonic during `start.sh` / Docker build by compiling a trivial `.tex`.
- **`ProfileResponse.applicationsCount` removal breaks mobile/admin** — Mitigation: document as adjacent impact; the field becomes `0` / removed; consumers handle gracefully (out of this spec's code boundary).

## References
- LangChain4j documentation — `AiServices`, `OpenAiChatModel`, structured output.
- OpenRouter API — `https://openrouter.ai/api/v1` (OpenAI-compatible).
- Tectonic — GitHub releases, static binary download, MIT license.
- DeepSeek model — `deepseek/deepseek-chat` via OpenRouter.

---

## Phase 2 — Resume Polish (Requirements 10–13)

### Context
Live testing on a real device surfaced four user-visible quality issues in the generated PDF:
1. The PDF content is the same across different jobs (LLM ignores the job context and just paraphrases the candidate's bio).
2. The header rule and the section's first line of body text touch each other (no vertical space).
3. The candidate's spoken languages never appear as a section — the only "Idiomas" text in the PDF is garbage from corrupted `education` records.
4. Skills are rendered as a flat list of 9–20 items; recruiters cannot quickly scan by domain.

### Discovery Type
**Light (Extension)** — internal to the existing pipeline, no new dependencies, no new boundaries, no new external integrations. Files touched: `prompts/resume-content-system-prompt.txt`, `TailoredResumeContent.java`, `LatexTemplateBuilder.java`, and their tests.

### Key Findings

#### 1. Tailoring is a prompt-strength problem, not a validation problem
The system prompt currently has one weak tailoring rule (rule 4: "adapte os bulletPoints para destacar realizações alinhadas com os requisitos da vaga"). Live evidence: the generated `professionalSummary` is the candidate's bio rephrased almost verbatim, with the same technology list and achievements regardless of the target job.
- **Conclusion**: Strengthen the prompt with at least three explicit tailoring rules (R10.3), require the summary to mention at least one concrete element of the job (R10.1), and require bullets to be rephrased not copied (R10.2). No post-LLM validation or re-ranking (decided out of scope per user direction; OpenRouter/DeepSeek has no guaranteed JSON mode and validation+retry would inflate latency and complexity for marginal benefit).

#### 2. Categorization must be done by the LLM
Two approaches were considered for skill categorization:
- **Hardcoded Java mapping** (e.g., `Ruby → Linguagens`, `Rails → Frameworks`) — rejected: requires a constantly-updated dictionary, fails on emerging skills, adds a code path that has nothing to do with generation logic.
- **LLM-emitted categories** (selected) — the LLM already has the candidate's skills in context and can group them per-job. The cost is mild prompt bloat; the benefit is no maintenance burden and per-job relevance.
- **Canonical category names** are fixed in the prompt to prevent the LLM from inventing names ("Linguagens", "Frameworks", "Bancos de Dados", "Ferramentas e Plataformas", "Metodologias"). Empty categories are omitted (R11.4).

#### 3. Languages is a missing template section, not a data problem
The `LatexTemplateBuilder` defines `writeHeader/Summary/Skills/Experiences/Education/Footer` but has **no `writeLanguages` method**. The `ProfileResponse.languages` field is fully populated by `ProfileService`, but the resume simply never reads it.
- **Conclusion**: Add `writeLanguages(p.languages())` to the template (R12.1). The section is omitted when the list is empty (R12.2). Each entry renders as `"Language (Level)"` (R12.4). User profile data quality issues (e.g., languages being entered as education records) are explicitly **out of scope** for this spec per user direction — `ai-resume-generator` does not own profile data validation.

#### 4. Section spacing is a LaTeX vspace problem
The `section()` helper emits `{\hrule height 0.45pt}\vspace{0.05cm}` then the body content runs directly with no `\par` or additional vertical space before the next section's heading. The result is the rule visually touches the next line of body text.
- **Conclusion**: Add a small vertical space (e.g., `\vspace{0.10cm}`) immediately after the `\hrule` and before the section's body content (R13.2), and a larger vertical space (e.g., `\vspace{0.20cm}`) at the end of each section's body content so the next section's heading has breathing room (R13.1). R13.4 constrains the values so a typical 1-page resume still fits on one A4 page.

### Architecture Pattern Evaluation (Phase 2)

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Strengthen prompt only (R10) | Add 3+ strict tailoring rules to the existing system prompt | Smallest change, no new code paths | Relies on LLM discipline; no enforcement | **Selected** per user direction (no post-LLM validation) |
| Post-LLM validation + retry (R10) | Reject summaries that don't contain job keywords, retry once | Stronger guarantee that tailoring happened | Adds latency, complexity, fragile to synonyms; OpenRouter/DeepSeek has no JSON mode guarantee | Rejected — out of scope per user decision |
| LLM-emitted categories (R11) | Add `categorizedSkills` field to `TailoredResumeContent`; LLM groups skills | Per-job relevance, no maintenance dictionary | Mild prompt bloat, mild LLM variance in category boundaries | **Selected** |
| Hardcoded Java category map (R11) | Static `Map<String, Category>` in `LatexTemplateBuilder` | Deterministic, no LLM variance | Brittle to new skills, requires ongoing dictionary maintenance | Rejected |
| Add `writeLanguages` (R12) | New method in `LatexTemplateBuilder` reading `ProfileResponse.languages` | Trivial, closes the gap | None | **Selected** |
| Validate profile data before sending to LLM (R12) | Filter/clean corrupted `education` records | Improves output quality | Out of spec boundary; `ai-resume-generator` is not the owner of profile data quality | Rejected — out of scope per user direction |

### Design Decisions (Phase 2)

#### Decision: Replace `highlightedSkills` with `categorizedSkills` in `TailoredResumeContent`
- **Context**: The record currently has a flat `List<String> highlightedSkills`; R11 requires categorization.
- **Selected approach**: Replace the field with `List<CategorizedSkill> categorizedSkills` where `CategorizedSkill = (category, items)`.
- **Rationale**: The record is internal to the generation pipeline (consumed only by `LatexTemplateBuilder`). Keeping both fields would be confusing dead code. A single, well-typed source of truth.
- **Trade-off**: The internal record shape changes, but no API/DTO/external consumer is affected.

#### Decision: Keep template as single Java class with new `writeLanguages` method
- **Context**: R12 needs a new section; current template is a single `LatexTemplateBuilder` class.
- **Selected approach**: Add `writeLanguages(List<LanguageDto>)` as a new private method, called from `build()` after `writeEducation()` and before `writeFooter()`.
- **Rationale**: Consistent with the existing `writeExperiences`/`writeEducation` pattern. No new component, no new file, no architecture change.
- **Trade-off**: The class gets slightly larger; acceptable since the new method is ~10 lines.

#### Decision: Spacing constants in the template, not per-call parameters
- **Context**: R13 needs visible spacing between sections.
- **Selected approach**: Hardcode `\vspace` values in `section()` and after each section's body. Document the values in the method.
- **Rationale**: The template is a fixed structure (per R3); per-call overrides would violate the "fixed template" contract. R13.4 constrains the values to keep a 1-page resume on 1 page.
- **Trade-off**: If the user later wants more/less spacing, it requires a code change. Acceptable for academic scope.

### Risks & Mitigations (Phase 2)
- **LLM still doesn't tailor** despite stronger prompt — Mitigation: R10.4 is testable (two sequential jobs for the same profile produce different summaries); if it fails, the test catches the regression. No auto-retry.
- **LLM invents category names** — Mitigation: R11.3 requires only the five canonical names; the test will parse the LLM output and assert category names.
- **Section spacing pushes content to page 2** — Mitigation: R13.4 explicitly tests that a typical 1-page resume still fits on 1 page. R13 values are conservative.
- **Existing resumes in DB used `highlightedSkills`** — Mitigation: `highlightedSkills` was only used by the template; no DB column, no API field, no persisted state. Nothing to migrate.
