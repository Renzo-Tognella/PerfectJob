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
