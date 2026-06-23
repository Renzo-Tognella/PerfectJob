# Design Document

---
**Purpose**: Provide sufficient detail to ensure implementation consistency across different implementers, preventing interpretation drift.

---

## Overview

**Purpose**: This feature delivers AI-tailored PDF resume generation to candidates. Instead of applying to jobs in-platform, a candidate generates a job-specific resume that highlights their most relevant skills and experiences based on the job's requirements.

**Users**: Job candidates use the REST API (via the mobile app) to generate, list, download, and delete tailored resumes. The API orchestrates an LLM call, LaTeX template filling, and tectonic PDF compilation.

**Impact**: Replaces the entire Application subsystem (entity, controller, service, event, DTOs, table) with a Resume generation pipeline. Removes `applicationsCount` from `ProfileResponse` (adjacent impact on mobile/admin consumers). Phase 2 polish hardens the LLM output (R10), introduces categorized skills (R11), adds a languages section (R12), and tightens visual spacing between sections (R13) without changing the architecture or adding new components.

### Goals
- Enable candidates to generate a polished, job-tailored PDF resume from their profile data + job requirements.
- Separate LLM content generation (structured JSON) from LaTeX rendering (deterministic Java template builder) for reliability.
- Fully remove the Application system and its database table.
- Integrate LangChain4j core deps (not starter) on Spring Boot 3.3.5 via manual bean wiring.
- **Phase 2 (R10)**: Enforce visible per-job tailoring in the LLM output by strengthening the system prompt with at least three distinct rules requiring adaptation to the target job.
- **Phase 2 (R11)**: Render the skills section grouped by five canonical categories, populated by the LLM, displayed in a fixed order.
- **Phase 2 (R12)**: Render the candidate's spoken languages as a distinct "Idiomas" section, omitted when the list is empty.
- **Phase 2 (R13)**: Ensure clear visible vertical space between sections so headings do not visually touch body text, while keeping a typical 1-page resume on one A4 page.

### Non-Goals
- Multiple resume templates (single fixed template).
- Async generation with progress streaming (synchronous for academic scope).
- Resume editing post-generation (regenerate instead).
- Spring Boot upgrade.
- Mobile UI changes (deferred to `mobile-resume-experience` spec).
- **Phase 2 (R10)**: Post-LLM validation, re-ranking, or keyword-presence checks on the LLM output. Decided out of scope per user direction; OpenRouter/DeepSeek does not guarantee JSON mode and validation+retry would inflate latency and complexity for marginal benefit.
- **Phase 2 (R12)**: Validating or cleaning the candidate's profile data (e.g., filtering corrupted `education` records). The `ai-resume-generator` spec does not own profile data quality.

## Boundary Commitments

### This Spec Owns
- The entire resume generation pipeline: LLM call → structured content → LaTeX template → tectonic PDF → storage.
- The `Resume` entity, `resumes` table, `ResumeRepository`.
- The `ResumeController` and all resume DTOs.
- The `service/resume/generate/` package (generation service, LaTeX builder, PDF compiler, LLM interface).
- The `config/LangChain4jConfig` bean wiring.
- The removal of all Application-related code and the `applications` table.
- The removal of `applicationsCount` from `ProfileResponse` and the `ApplicationRepository` reference in `ProfileService`.
- The `start.sh` / `.env.example` / `application.yml` changes for LLM and tectonic configuration.

### Out of Boundary
- Mobile UI for resume browsing/generation/preview (Spec: `mobile-resume-experience`).
- Job external URL field (Spec: `job-external-url`).
- Profile data model changes (profile is read-only input via `ProfileService`).
- Existing CV analyzer modifications (`ResumeAnalyzer`, `PdfTextExtractor` stay untouched).
- Recruiter/admin UI changes (admin loses application tracking — academic scope).
- Changes to `NotificationService` beyond removing the application-status method if unused.

### Allowed Dependencies
- `ProfileService.getProfile(userId)` → `ProfileResponse` (read-only input).
- `JobRepository` / `JobService` → `Job` entity (read-only input).
- `UserRepository` → candidate lookup.
- LangChain4j core libraries (`langchain4j`, `langchain4j-open-ai`).
- Tectonic binary (external process, configurable path).
- Filesystem for PDF storage.

### Revalidation Triggers
- `ProfileResponse` shape change (removal of `applicationsCount`) → mobile/admin consumers must re-check.
- `resumes` table schema change → migration consumers must re-check.
- Resume API contract change (`ResumeResponse` / `ResumeDetailResponse`) → `mobile-resume-experience` must re-check.
- `JobResponse` shape change (by `job-external-url` spec) → no impact on generation (reads `Job` entity directly).

## Architecture

### Existing Architecture Analysis
- The API follows a strict layered architecture: `controller/v1` → `service` → `repository` → `model`. DTOs are Java records in `dto/request` and `dto/response`. Entities use Lombok `@Data` + `@Builder`. Mappers are static utility classes in `service/mapper`.
- `PerfectJobApplication` has `@EnableSpringDataWebSupport(VIA_DTO)` — `Page<T>` returns DTOs, never entities.
- The `service/resume/` package already exists (contains `ResumeAnalyzer` and `PdfTextExtractor` for intake). The generator subsystem is a sibling under `service/resume/generate/`.
- `ProfileService.toResponse()` is the single assembler of `ProfileResponse` and injects `ApplicationRepository` for the applications count.
- No LLM or AI dependencies exist in `pom.xml`.

### Architecture Pattern & Boundary Map

```mermaid
graph TB
    subgraph "API Layer"
        RC[ResumeController]
    end
    subgraph "Service Layer"
        RS[ResumeService]
        RGS[ResumeGenerationService]
        RTB[LatexTemplateBuilder]
        TPC[TectonicPdfCompiler]
        RCA[ResumeContentAiService<br/>LangChain4j AiServices proxy]
        RPS[ResumePdfStorage]
    end
    subgraph "Data Layer"
        RR[ResumeRepository]
        RE[Resume Entity]
        RT[resumes table]
    end
    subgraph "Read-only Inputs"
        PS[ProfileService]
        JR[JobRepository]
    end
    subgraph "External"
        OR[OpenRouter / DeepSeek]
        TEC[Tectonic Binary]
        FS[Filesystem]
    end

    RC -->|generate / list / detail / pdf / delete| RS
    RS -->|orchestrate| RGS
    RS -->|persist / query| RR
    RS -->|stream file| RPS
    RGS -->|get profile| PS
    RGS -->|get job| JR
    RGS -->|structured content| RCA
    RGS -->|build LaTeX| RTB
    RGS -->|compile PDF| TPC
    RCA -->|OpenAI-compatible API| OR
    TPC -->|ProcessBuilder| TEC
    RPS -->|read / write / delete| FS
    RR --> RE
    RE --> RT
```

**Architecture Integration**:
- Selected pattern: Pipeline (orchestrated by `ResumeGenerationService`) with clear stages: load inputs → LLM → template → compile → store.
- Domain boundary: All generation logic is isolated in `service/resume/generate/`. The controller and `ResumeService` are thin orchestrators.
- Existing patterns preserved: layered architecture, Lombok entities, Java record DTOs, static mapper utility, `@RestControllerAdvice` global exception handling.
- New components rationale: Each pipeline stage is a separate class for testability and single responsibility.

### Phase 2 — Polish Updates (Requirements 10–13)

The polish work keeps the same pipeline and does **not** add new components. It modifies three existing files in `service/resume/generate/` plus the system prompt, and updates the unit tests.

**Scope of change**:

| File | Change | Requirements |
|------|--------|--------------|
| `prompts/resume-content-system-prompt.txt` | Strengthen tailoring rules (≥3); add canonical categories for skills; instruct LLM to use only those names; instruct LLM to omit empty categories | R10.1, R10.2, R10.3, R11.2, R11.3, R11.4 |
| `TailoredResumeContent.java` | Replace `List<String> highlightedSkills` with `List<CategorizedSkill> categorizedSkills`; add new `CategorizedSkill(category, items)` record | R11.1, R11.2, R11.4 |
| `LatexTemplateBuilder.java` | (a) Update `writeSkills` to render by category in fixed order; (b) add new `writeLanguages` method invoked from `build()`; (c) update `section()` and post-section spacing to satisfy R13 | R11.5, R11.6, R12.1, R12.2, R12.3, R12.4, R12.5, R13.1, R13.2, R13.3, R13.4 |

**Why no new components**:
- The LLM call site (`ResumeContentAiService` interface and proxy) does not change — only the prompt resource.
- The structured record change is in-place (no parallel schema; the old field is removed, not deprecated).
- The template additions are local to the existing class — `writeLanguages` is ~10 lines, `writeSkills` adapts in place.
- The spacing change is a few `\vspace` constants inside `section()` and the per-section tail.

**Boundary reaffirmation**: All changes stay inside the `service/resume/generate/` package. The REST API contract, `Resume` entity, `ResumeRepository`, `ResumeController`, and `ResumeService` are not touched. The `ProfileResponse` DTO is consumed as-is; the new `writeLanguages` reads `p.languages()` which is already present in the record.

### Technology Stack

| Layer | Choice / Version | Role in Feature | Notes |
|-------|------------------|-----------------|-------|
| Backend / Services | Spring Boot 3.3.5, Java 21 | API, orchestration, REST | Stay on current version |
| LLM Integration | LangChain4j core (`langchain4j`, `langchain4j-open-ai`) 1.x | LLM call, structured output proxy | Core deps, not starter (SB 3.3.5) |
| LLM Provider | OpenRouter (`https://openrouter.ai/api/v1`) + DeepSeek (`deepseek/deepseek-chat`) | Resume content generation | OpenAI-compatible API |
| PDF Compilation | Tectonic static binary (x86_64 Linux, MIT) | LaTeX → PDF | ProcessBuilder invocation |
| Data / Storage | PostgreSQL 16 (`resumes` table) + Filesystem (`data/resumes/`) | Resume metadata + PDF files | Flyway V10 migration |
| Infrastructure / Runtime | `maven:3.9-eclipse-temurin-21` Docker image | Container for API + tectonic | `start.sh` handles install |

## File Structure Plan

### Directory Structure
```
perfectjob-api/src/main/java/com/perfectjob/
├── config/
│   └── LangChain4jConfig.java          # @Bean OpenAiChatModel + AiServices wiring
├── controller/v1/
│   └── ResumeController.java           # POST/GET/DELETE /v1/resumes endpoints
├── dto/
│   ├── request/
│   │   └── GenerateResumeRequest.java  # { jobId } record
│   └── response/
│       ├── ResumeResponse.java         # metadata for list + generate
│       └── ResumeDetailResponse.java   # details + job description for detail view
├── model/
│   └── Resume.java                     # JPA entity (replaces Application)
├── repository/
│   └── ResumeRepository.java           # Spring Data JPA
├── service/
│   ├── resume/
│   │   └── generate/
│   │       ├── ResumeGenerationService.java  # orchestrates pipeline stages
│   │       ├── LatexTemplateBuilder.java     # structured content → .tex string
│   │       ├── TectonicPdfCompiler.java      # .tex → PDF via ProcessBuilder
│   │       ├── ResumeContentAiService.java   # LangChain4j AiServices interface
│   │       └── TailoredResumeContent.java    # structured record from LLM
│   ├── ResumeService.java              # CRUD + orchestration (called by controller)
│   └── ProfileService.java             # MODIFIED: remove ApplicationRepository
├── dto/response/
│   └── ProfileResponse.java            # MODIFIED: remove applicationsCount field
```

### Modified Files
- `perfectjob-api/pom.xml` — Add `langchain4j` + `langchain4j-open-ai` deps with version property.
- `perfectjob-api/src/main/resources/application.yml` — Add `perfectjob.resume` namespace (storage-dir, tectonic-path, compile-timeout).
- `perfectjob-api/src/main/resources/db/migration/V10__add_resumes_drop_applications.sql` — New migration.
- `perfectjob-api/src/main/java/com/perfectjob/service/ProfileService.java` — Remove `ApplicationRepository` injection, remove `applicationsCount` computation.
- `perfectjob-api/src/main/java/com/perfectjob/dto/response/ProfileResponse.java` — Remove `applicationsCount` field.
- `.env.example` — Add `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_BASE_URL`, `TECTONIC_PATH`, `PERFECTJOB_RESUME_STORAGE_DIR`.
- `start.sh` — Add tectonic download + font cache warm when in Docker mode.
- **Phase 2 (R10, R11)**: `perfectjob-api/src/main/resources/prompts/resume-content-system-prompt.txt` — Strengthen tailoring rules (≥3), add canonical category names, instruct LLM to use only those names and omit empty categories.
- **Phase 2 (R11)**: `perfectjob-api/src/main/java/com/perfectjob/service/resume/generate/TailoredResumeContent.java` — Replace `List<String> highlightedSkills` with `List<CategorizedSkill> categorizedSkills`; add `CategorizedSkill(String category, List<String> items)` record.
- **Phase 2 (R11, R12, R13)**: `perfectjob-api/src/main/java/com/perfectjob/service/resume/generate/LatexTemplateBuilder.java` — Update `writeSkills` to render by category in fixed order; add `writeLanguages(List<LanguageDto>)`; update `section()` and per-section tail with vspace for visible separation.
- **Phase 2 tests**: `perfectjob-api/src/test/java/com/perfectjob/service/resume/generate/LatexTemplateBuilderTest.java` — Add tests for categorized skills rendering, languages section (presence/absence), and vspace assertions. `ResumeGenerationServiceTest.java` — Add tests asserting the LLM call receives both profile and job context. `ResumeContentAiServiceTest.java` (if it exists, otherwise a new prompt-resource-loading test) — Assert the system prompt contains ≥3 tailoring rules.

### Deleted Files
- `model/Application.java`
- `controller/v1/ApplicationController.java`
- `service/ApplicationService.java`
- `repository/ApplicationRepository.java`
- `service/mapper/ApplicationMapper.java`
- `event/ApplicationSubmittedEvent.java`
- `model/enums/ApplicationStatus.java`
- `dto/request/SubmitApplicationRequest.java`
- `dto/request/UpdateApplicationStatusRequest.java`
- `dto/response/ApplicationResponse.java`

## System Flows

### Resume Generation Flow

```mermaid
sequenceDiagram
    participant C as Candidate (Mobile)
    participant RC as ResumeController
    participant RS as ResumeService
    participant RGS as ResumeGenerationService
    participant PS as ProfileService
    participant JR as JobRepository
    participant AI as ResumeContentAiService (LLM)
    participant TB as LatexTemplateBuilder
    participant TPC as TectonicPdfCompiler
    participant FS as Filesystem
    participant RR as ResumeRepository

    C->>RC: POST /v1/resumes {jobId}
    RC->>RS: generate(userId, jobId)
    RS->>RGS: generate(ProfileResponse, Job)
    RGS->>PS: getProfile(userId)
    PS-->>RGS: ProfileResponse
    RGS->>JR: findById(jobId)
    JR-->>RGS: Job
    RGS->>AI: generateTailoredContent(profile, job)
    alt LLM returns valid JSON
        AI-->>RGS: TailoredResumeContent
    else Malformed response
        AI-->>RGS: parse error
        RGS->>AI: retry generateTailoredContent
        alt Retry succeeds
            AI-->>RGS: TailoredResumeContent
        else Retry fails
            RGS-->>RS: throw ResumeGenerationException
            RS-->>RC: 500 error
        end
    end
    RGS->>TB: build(content, profile)
    TB-->>RGS: String latexSource
    RGS->>TPC: compile(latexSource)
    TPC->>TPC: write temp .tex
    TPC->>TPC: ProcessBuilder tectonic
    alt Exit code 0
        TPC-->>RGS: byte[] pdf
    else Non-zero exit
        TPC-->>RGS: throw PdfCompilationException
    end
    RGS->>FS: write {resumeId}.pdf
    RGS-->>RS: {latexSource, pdfPath}
    RS->>RR: save(Resume entity)
    RS-->>RC: ResumeResponse
    RC-->>C: 200 ResumeResponse
```

### Resume Deletion Flow

```mermaid
sequenceDiagram
    participant C as Candidate
    participant RC as ResumeController
    participant RS as ResumeService
    participant RR as ResumeRepository
    participant FS as Filesystem

    C->>RC: DELETE /v1/resumes/{id}
    RC->>RS: delete(userId, resumeId)
    RS->>RR: findById(resumeId)
    RR-->>RS: Resume
    RS->>RS: verify ownership (userId match)
    alt Not owner
        RS-->>RC: 403 Forbidden
    else Owner
        RS->>FS: delete pdfStoragePath file
        RS->>RR: delete(resume)
        RS-->>RC: 204 No Content
    end
    RC-->>C: 204
```

## Data Models

### Domain Model

```mermaid
classDiagram
    class Resume {
        +Long id
        +Long userId
        +Long jobId
        +String pdfStoragePath
        +String latexSource
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
    }
    class User {
        +Long id
        +String email
        +String fullName
        +String headline
        +String bio
        +List~String~ skills
    }
    class Job {
        +Long id
        +String title
        +String description
        +String requirements
        +List~String~ skills
    }
    class TailoredResumeContent {
        +String professionalSummary
        +List~String~ highlightedSkills
        +List~TailoredExperience~ tailoredExperiences
    }
    class TailoredExperience {
        +String title
        +String company
        +String startDate
        +String endDate
        +List~String~ bulletPoints
    }

    Resume }o--|| User : belongs to
    Resume }o--|| Job : generated for
    TailoredResumeContent *-- TailoredExperience
```

### Logical Data Model

**Resume Entity** (`resumes` table):
- `id` BIGSERIAL PRIMARY KEY
- `user_id` BIGINT NOT NULL (references `users(id)`)
- `job_id` BIGINT NOT NULL (references `jobs(id)`)
- `pdf_storage_path` VARCHAR(1024) NOT NULL
- `latex_source` TEXT (full LaTeX source for archival/regeneration)
- `created_at` TIMESTAMP NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMP NOT NULL DEFAULT NOW()

**Consistency & Integrity**:
- `resumes.user_id` FK to `users(id) ON DELETE CASCADE` — deleting a user removes their resumes.
- `resumes.job_id` FK to `jobs(id)` — no cascade (jobs may persist after resume generation).
- Index on `resumes(user_id)` for list queries.
- Index on `resumes(user_id, job_id)` for dedup checks.

### Physical Data Model

**Migration: `V10__add_resumes_drop_applications.sql`**
```sql
CREATE TABLE resumes (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id          BIGINT NOT NULL REFERENCES jobs(id),
    pdf_storage_path VARCHAR(1024) NOT NULL,
    latex_source    TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_resumes_user ON resumes(user_id);
CREATE INDEX idx_resumes_user_job ON resumes(user_id, job_id);

DROP TABLE IF EXISTS applications;
```

> **Migration coordination**: `job-external-url` spec uses V9 (`V9__add_job_external_url.sql`). This spec uses V10. If merge order changes, renumber to maintain append-only ordering.

### Data Contracts & Integration

**Request/Response Schemas**:

`GenerateResumeRequest`:
```java
public record GenerateResumeRequest(
    @NotNull Long jobId
) {}
```

`ResumeResponse`:
```java
public record ResumeResponse(
    Long id,
    Long jobId,
    String jobTitle,
    String pdfStoragePath,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
```

`ResumeDetailResponse`:
```java
public record ResumeDetailResponse(
    Long id,
    Long jobId,
    String jobTitle,
    String jobDescription,
    String pdfStoragePath,
    String latexSource,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
```

## Requirements Traceability

| Requirement | Summary | Components | Interfaces | Flows |
|-------------|---------|------------|------------|-------|
| 1.1–1.6 | LLM Integration | LangChain4jConfig, OpenAiChatModel bean | application.yml, .env | Generation |
| 2.1–2.5 | Structured Output | ResumeContentAiService, TailoredResumeContent | AiServices proxy | Generation |
| 3.1–3.5 | LaTeX Template | LatexTemplateBuilder | build() | Generation |
| 4.1–4.5 | PDF Compilation | TectonicPdfCompiler | compile() | Generation |
| 5.1–5.5 | Resume Entity/Storage | Resume, ResumeRepository, V10 migration | resumes table, filesystem | Generation, Deletion |
| 6.1–6.8 | REST API | ResumeController, ResumeService | /v1/resumes endpoints | Generation, List, Detail, PDF, Deletion |
| 7.1–7.6 | Application Removal | (deleted files), ProfileService, ProfileResponse | V10 migration | Startup |
| 8.1–8.4 | Infrastructure | start.sh, .env.example, application.yml | Docker, config | Startup |
| 9.1–9.6 | Error Handling | ResumeService, TectonicPdfCompiler, GlobalExceptionHandler | exception types | All flows |
| 10.1, 10.2, 10.3, 10.5 | Per-Job Tailoring Enforcement (Phase 2) | `ResumeContentAiService`, `prompts/resume-content-system-prompt.txt` | @SystemMessage resource, AiServices proxy | Generation |
| 10.4 | Per-Job Tailoring (different jobs → different summaries) | `ResumeGenerationService`, `ResumeContentAiService` | generate(userId, job) | Generation |
| 11.1, 11.2, 11.3, 11.4 | Categorized Skills (Phase 2) | `TailoredResumeContent` (record + new `CategorizedSkill` record), system prompt | categorizedSkills field | Generation |
| 11.5, 11.6 | Skills rendered by category in fixed order (Phase 2) | `LatexTemplateBuilder.writeSkills` | writeSkills(List<CategorizedSkill>) | Generation |
| 12.1, 12.2, 12.3, 12.4, 12.5 | Languages section (Phase 2) | `LatexTemplateBuilder.writeLanguages` | writeLanguages(List<LanguageDto>) | Generation |
| 13.1, 13.2, 13.3, 13.4 | Visual section spacing (Phase 2) | `LatexTemplateBuilder.section` (helper), each section writer | section() vspace constants | Generation |

## Components and Interfaces

### Service Layer

#### ResumeController

| Field | Detail |
|-------|--------|
| Intent | HTTP entry point for all resume CRUD operations |
| Requirements | 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8 |

**API Contract**:
| Method | Endpoint | Request | Response | Errors |
|--------|----------|---------|----------|--------|
| POST | /v1/resumes | GenerateResumeRequest | ResumeResponse | 400, 404, 500, 502 |
| GET | /v1/resumes | (Pageable) | Page\<ResumeResponse\> | 401 |
| GET | /v1/resumes/{id} | — | ResumeDetailResponse | 403, 404 |
| GET | /v1/resumes/{id}/pdf | — | application/pdf (stream) | 403, 404 |
| DELETE | /v1/resumes/{id} | — | 204 | 403, 404 |

**Implementation Notes**:
- Delegates entirely to `ResumeService`. Uses `CurrentUserResolver` for the authenticated user.
- PDF endpoint returns `ResponseEntity<Resource>` or `StreamingResponseBody` with `Content-Type: application/pdf`.
- All endpoints require `@PreAuthorize("isAuthenticated()")`.

---

#### ResumeService

| Field | Detail |
|-------|--------|
| Intent | CRUD + generation orchestration for resumes |
| Requirements | 5.1, 5.5, 6.1–6.8, 9.5, 9.6 |

**Service Interface**:
```java
interface ResumeService {
    ResumeResponse generate(Long userId, GenerateResumeRequest request);
    Page<ResumeResponse> listByUser(Long userId, Pageable pageable);
    ResumeDetailResponse getDetail(Long userId, Long resumeId);
    Resource getPdf(Long userId, Long resumeId);
    void delete(Long userId, Long resumeId);
}
```
- Preconditions: `userId` is authenticated and is a CANDIDATE.
- Postconditions: Resume is persisted with a valid `pdfStoragePath`; PDF file exists on disk.
- Invariants: A resume always belongs to the generating user; PDF path is always under the configured storage directory.

**Dependencies**:
- Outbound: `ResumeGenerationService` (generation pipeline), `ResumeRepository` (persistence), `ResumePdfStorage` (filesystem).
- Outbound: `JobRepository` (job existence check).

**Implementation Notes**:
- Ownership checks: `resume.getUserId().equals(requestedUserId)` → 403 if mismatch.
- File deletion: remove PDF from filesystem, then delete DB record (best-effort file deletion; log warning if file missing).

---

#### ResumeGenerationService

| Field | Detail |
|-------|--------|
| Intent | Orchestrate the pipeline: LLM → LaTeX → PDF → file write |
| Requirements | 2.1–2.5, 3.1, 4.1–4.5, 5.2, 5.3 |

**Service Interface**:
```java
interface ResumeGenerationService {
    GenerationResult generate(ProfileResponse profile, Job job);
}
```
- Postconditions: Returns `GenerationResult(latexSource, pdfBytes)`; caller persists.
- The service writes the PDF file to disk via `ResumePdfStorage` after the compile step.

**Dependencies**:
- Outbound: `ResumeContentAiService` (LLM call + retry), `LatexTemplateBuilder`, `TectonicPdfCompiler`, `ResumePdfStorage`.
- External: OpenRouter API (via LangChain4j), tectonic binary (via ProcessBuilder).

**Implementation Notes**:
- Retry logic: if `ResumeContentAiService.generateTailoredContent(...)` throws a parsing exception, retry once. On second failure, throw `ResumeContentException`.
- Transaction boundary: LLM call and compilation are NOT inside a DB transaction (they're side-effectful I/O). Only the final `ResumeRepository.save()` is transactional.

---

#### LatexTemplateBuilder

| Field | Detail |
|-------|--------|
| Intent | Build a complete LaTeX document string from structured content + profile data |
| Requirements | 3.1, 3.2, 3.3, 3.4, 3.5, **R11.5, R11.6, R12.1, R12.2, R12.3, R12.4, R12.5, R13.1, R13.2, R13.3, R13.4** |

**Service Interface**:
```java
class LatexTemplateBuilder {
    String build(TailoredResumeContent content, ProfileResponse profile);
}
```

**Implementation Notes**:
- Uses Java text blocks for the fixed template skeleton.
- Escapes LaTeX special characters (`&`, `%`, `$`, `#`, `_`, `{`, `}`, `~`, `^`, `\`) in all dynamic content via a private `escapeLatex(String)` method.
- Colors hardcoded: `\definecolor{textgray}{HTML}{565656}`, `\definecolor{rulegray}{HTML}{8A8A8A}`.
- Template structure: `\documentclass{article}` + `\usepackage{helvet}` + custom commands + `\begin{document}` + `\begin{cvcontent}` ... `\end{cvcontent}` + `\end{document}`.
- Unit-testable: takes pure data in, returns a string, no I/O.
- **Phase 2 (R11)**: `writeSkills` signature changes from `List<String>` to `List<CategorizedSkill>`. It iterates categories in the fixed order Linguagens → Frameworks → Bancos de Dados → Ferramentas e Plataformas → Metodologias, skipping any category that is missing or has an empty items list (R11.4). Within each category, items render as a compact comma-separated line.
- **Phase 2 (R12)**: New `writeLanguages(List<LanguageDto>)` method. Renders the section heading `"Idiomas"` using the same `section()` helper as the other sections (R12.3). Body is one line per language in the format `"Language (Level)"` (R12.4), in the order they appear in the profile (R12.5). The entire method is a no-op when the list is null or empty (R12.2). Called from `build()` after `writeEducation()` and before `writeFooter()`.
- **Phase 2 (R13)**: `section()` now emits a small vertical space (`\vspace{0.10cm}`) after the `\hrule` so the body content does not touch the rule (R13.2). Each section's writer appends a larger vertical space (`\vspace{0.20cm}`) at the end of its body so the next section's heading has breathing room (R13.1). Values are conservative to keep a typical 1-page resume on one A4 page (R13.4).

---

#### TectonicPdfCompiler

| Field | Detail |
|-------|--------|
| Intent | Compile `.tex` source to PDF via tectonic binary |
| Requirements | 4.1, 4.2, 4.3, 4.4, 4.5 |

**Service Interface**:
```java
class TectonicPdfCompiler {
    byte[] compile(String latexSource) throws PdfCompilationException;
}
```

**Implementation Notes**:
- Writes `latexSource` to a temp file (`Files.createTempFile("resume-", ".tex")`).
- Runs `new ProcessBuilder(tectonicPath, "--outdir", tempDir, texFile).redirectErrorStream(true)` with a configurable timeout.
- Reads the resulting `.pdf` from `tempDir`, returns bytes, cleans up temp files.
- Non-zero exit → throw `PdfCompilationException` with stderr excerpt.
- Binary not found (`IOException`) → throw `TectonicNotFoundException` with install guidance.
- Timeout → `process.destroyForcibly()`, throw `PdfCompilationException`.

---

#### ResumeContentAiService (LangChain4j AiServices interface)

| Field | Detail |
|-------|--------|
| Intent | Typed proxy for LLM structured output |
| Requirements | 2.1, 2.3, **R10.1, R10.2, R10.3, R10.5, R11.2, R11.3, R11.4** |

**Service Interface**:
```java
interface ResumeContentAiService {
    @SystemMessage(fromResource = "prompts/resume-content-system-prompt.txt")
    @UserMessage("CANDIDATE PROFILE:\n{{profile}}\n\n---\n\nJOB POSTING:\n{{job}}\n\n---\n\nGenerate the tailored resume JSON.")
    TailoredResumeContent generateTailoredContent(
        @V("profile") String profileJson,
        @V("job") String jobContext
    );
}
```
- The system prompt (pt-BR) instructs the LLM to produce JSON matching `TailoredResumeContent` schema with a few-shot example.
- LangChain4j `AiServices` parses the response into the record automatically.
- **Phase 2 (R10)**: System prompt now contains at least three distinct rules requiring adaptation to the target job. Concretely: (1) `professionalSummary` must mention at least one element from the job's title, required skills, or description; (2) `tailoredExperiences[].bulletPoints` must be rephrased (not copied) to highlight achievements relevant to the job's requirements; (3) `categorizedSkills` must contain only skills the candidate has AND that are relevant to the job, ordered by relevance. Both the candidate profile and the job posting are included in the LLM call (R10.5).
- **Phase 2 (R11)**: System prompt defines five canonical category names — "Linguagens", "Frameworks", "Bancos de Dados", "Ferramentas e Plataformas", "Metodologias" — and instructs the LLM to use only these names, omit empty categories.

---

#### TailoredResumeContent (record)

**Updated for Phase 2 (R11).** The `highlightedSkills` flat list is **replaced** by `categorizedSkills`, a list of `(category, items)` pairs. The LLM emits only the five canonical category names. The template renders them in a fixed order, omitting empty categories.

```java
record CategorizedSkill(String category, List<String> items) {}

record TailoredResumeContent(
    String professionalSummary,
    List<CategorizedSkill> categorizedSkills,   // ← Phase 2: replaces highlightedSkills (R11)
    List<TailoredExperience> tailoredExperiences
) {}

record TailoredExperience(
    String title,
    String company,
    String startDate,
    String endDate,
    List<String> bulletPoints
) {}
```

**Migration impact**: The record is internal to `service/resume/generate/`. No API field, no DB column, no persisted state depends on `highlightedSkills`. The change is transparent to mobile, admin, and any external consumer.

---

### Configuration Layer

#### LangChain4jConfig

| Field | Detail |
|-------|--------|
| Intent | Manual bean wiring for OpenAiChatModel + AiServices proxy |
| Requirements | 1.1, 1.2, 1.3, 1.4, 1.5, 1.6 |

**Implementation Notes**:
- `@Configuration` class with `@Value` properties from `perfectjob.resume.openrouter.*` namespace.
- `@Bean OpenAiChatModel openAiChatModel()` — builds with `baseUrl`, `apiKey`, `modelName`, `temperature(0.7)`, `timeout(Duration.ofSeconds(60))`.
- `@Bean ResumeContentAiService resumeContentAiService(OpenAiChatModel model)` — `AiServices.builder(ResumeContentAiService.class).chatLanguageModel(model).build()`.
- If `apiKey` is blank, the bean is still created (lazy failure at call time with a clear message).

---

### Data Layer

#### Resume Entity

```java
@Entity
@Table(name = "resumes")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Resume {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(name = "job_id", nullable = false)
    private Long jobId;
    @Column(name = "pdf_storage_path", nullable = false, length = 1024)
    private String pdfStoragePath;
    @Column(name = "latex_source", columnDefinition = "TEXT")
    private String latexSource;
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
```

#### ResumeRepository

```java
@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    Page<Resume> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Optional<Resume> findByIdAndUserId(Long id, Long userId);
}
```

## Error Handling

### Error Strategy
All pipeline errors are caught in `ResumeService.generate()` and translated into appropriate HTTP responses via `GlobalExceptionHandler`. New exception types extend `RuntimeException` and are handled by new `@ExceptionHandler` methods or mapped to existing handlers.

### Error Categories and Responses

| Error Type | HTTP Status | Condition | Message |
|------------|-------------|-----------|---------|
| `ResourceNotFoundException` | 404 | Job not found; Resume not found | Existing handler |
| `AccessDeniedException` | 403 | User doesn't own resume | Existing handler |
| `MissingApiKeyException` | 500 | `OPENROUTER_API_KEY` unset | "API key not configured" |
| `LlmServiceUnavailableException` | 502 | OpenRouter unreachable/HTTP error | "AI service temporarily unavailable" |
| `ResumeContentException` | 500 | Malformed LLM output after retry | "Failed to generate resume content" |
| `PdfCompilationException` | 500 | Tectonic non-zero exit or timeout | "PDF compilation failed: {error excerpt}" |
| `TectonicNotFoundException` | 500 | Binary missing at configured path | "Tectonic not found. Install it to compile PDFs." |
| `StorageException` | 500 | Filesystem write/delete failure | "Failed to store/delete resume file" |

**New exception classes** added to `exception/` package:
- `ResumeGenerationException` (base, extends `RuntimeException`)
- `LlmServiceUnavailableException extends ResumeGenerationException`
- `ResumeContentException extends ResumeGenerationException`
- `PdfCompilationException extends ResumeGenerationException`
- `TectonicNotFoundException extends ResumeGenerationException`

**GlobalExceptionHandler additions**:
- `@ExceptionHandler(ResumeGenerationException.class)` → maps subtypes to HTTP statuses.
- `@ExceptionHandler(LlmServiceUnavailableException.class)` → 502.

### Monitoring
- Structured logging: `log.info("AUDIT: resume generated userId={} jobId={} resumeId={}", ...)` on success.
- Error logging: `log.error("Resume generation failed userId={} jobId={} error={}", ...)` on pipeline failures.
- Tectonic stderr captured and logged at WARN level on compilation failure.

## Testing Strategy

### Unit Tests
- **LatexTemplateBuilder**: Given a fixed `TailoredResumeContent` + `ProfileResponse`, assert the output `.tex` string contains expected sections, commands, and escaped characters. (Tests `escapeLatex` for all special chars.)
  - **Phase 2 (R11.5, R11.6)**: Given a `TailoredResumeContent` with categories in mixed order, assert the rendered LaTeX contains the categories in the canonical order (Linguagens, Frameworks, Bancos de Dados, Ferramentas e Plataformas, Metodologias), and empty categories are absent.
  - **Phase 2 (R12.1, R12.3, R12.4, R12.5)**: Given a `ProfileResponse` with a non-empty `languages` list, assert the rendered LaTeX contains the section heading "IDIOMAS" and each language as `"Language (Level)"` in the order provided.
  - **Phase 2 (R12.2)**: Given a `ProfileResponse` with empty `languages`, assert the rendered LaTeX does NOT contain "IDIOMAS".
  - **Phase 2 (R13.1, R13.2, R13.3)**: Assert the rendered LaTeX contains `\vspace` between every section's content and the next section's heading, and that the rule (`\hrule`) is followed by a `\vspace` before the section's body.
  - **Phase 2 (R13.4)**: With a typical full profile (3 experiences, education, languages, categorized skills), assert the rendered LaTeX is ≤ one A4 page (heuristic: count `\newpage` or assert the content fits in a fixed character budget proportional to a single page).
- **TectonicPdfCompiler**: Mock `ProcessBuilder` / `Process`; assert exit code 0 returns bytes, non-zero throws `PdfCompilationException` with stderr, timeout triggers `destroyForcibly`.
- **ResumeContentAiService**: Mock the LLM proxy; assert valid JSON parses into `TailoredResumeContent`; assert malformed JSON throws on first attempt.
  - **Phase 2 (R10.3)**: Load the `prompts/resume-content-system-prompt.txt` resource and assert it contains at least three distinct tailoring rules (regex for keywords like "mencione", "adapte", "reformule", "referencie", or structural count of bullet items).
- **ResumeGenerationService**: Mock all sub-components; assert happy-path returns `GenerationResult`; assert retry on first parse failure; assert error on second failure.
  - **Phase 2 (R10.5)**: Assert the LLM call is invoked with both `profileJson` and `jobContext` non-empty in the user message (capture and assert the user-message template variables).

### Integration Tests
- **ResumeService.generate()**: With mocked LLM + mocked tectonic (or `@MockBean`), assert a `Resume` is persisted, PDF file is written to a temp storage dir, and `ResumeResponse` is returned.
- **ResumeController** (Spring Boot Test + H2): Assert POST returns 200 + body, GET list returns page, GET detail returns job info, GET pdf streams bytes, DELETE removes record + file.
- **Ownership check**: Assert 403 when user B requests user A's resume.

### E2E / Manual Tests
- **Full pipeline with real tectonic**: Generate a resume from a real profile + job; assert PDF is valid (opens in a reader, has correct content sections).
- **Application removal**: Assert the app starts with no `Application` class, `applications` table is dropped, `ProfileResponse` has no `applicationsCount`.
- **Missing API key**: Assert app starts; generation returns a clear error.
- **Phase 2 (R10.4)**: Generate resumes for the same candidate profile with two different jobs; assert the two generated `professionalSummary` texts differ in at least one of: wording, mentioned technologies, or mentioned achievements. (Requires real `OPENROUTER_API_KEY`; runs as a slow test, gated by env var.)
- **Phase 2 visual sanity check**: Render a resume and visually inspect that (a) each section heading has visible vertical space above and below, (b) "Idiomas" appears when languages exist, (c) skills are grouped under the five canonical category headings, (d) no section heading touches the next line of body text.
