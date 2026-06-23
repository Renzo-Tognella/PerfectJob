# Requirements Document

## Introduction

PerfectJob is pivoting its candidate-facing flow from in-platform "submit application" to "generate tailored resume". Candidates want a polished, job-specific PDF resume adapted to each job's requirements, using their stored profile data (skills, experience, education, languages, headline, bio). The platform should leverage LLM-based content generation plus a fixed LaTeX template to produce the PDF server-side. The existing Application system (entity, controller, service, event, DTOs, table) is being fully replaced by this resume generation flow.

The candidate calls a single endpoint with a job ID. The system loads the candidate's profile and the job's requirements, sends them to an LLM that returns structured tailored content (summary, experience bullet points, skill emphasis), fills a fixed LaTeX template deterministically in Java, compiles the `.tex` to PDF via tectonic, stores the result, and returns resume metadata. The candidate can then list, view, download, and delete generated resumes.

This spec owns the entire backend pipeline: LLM integration (LangChain4j core deps with OpenRouter/DeepSeek), structured output parsing, LaTeX template building, tectonic PDF compilation, the `Resume` entity and storage, the REST API, the Flyway migration that creates the `resumes` table and drops the `applications` table, and the deletion of all Application-related code.

## Boundary Context

- **In scope**:
  - LangChain4j core dependency integration with OpenRouter/DeepSeek (manual bean wiring, no starter)
  - Structured LLM output (JSON) for tailored resume content with retry on malformed responses
  - Deterministic LaTeX template building from structured content (fixed template, LLM never produces LaTeX)
  - Tectonic PDF compilation via ProcessBuilder
  - `Resume` entity, `resumes` table, filesystem PDF storage
  - REST API: generate, list, detail (with job description), PDF stream, delete
  - Full removal of the Application system (entity, controller, service, event, DTOs, enum, repository, mapper, table)
  - Docker/start.sh changes for tectonic installation and font cache warming
  - Environment variable configuration for LLM provider and tectonic
- **Out of scope**:
  - Multiple resume templates (single fixed template only)
  - Resume editing after generation (regenerate instead)
  - Streaming generation progress (synchronous for now)
  - Batch generation
  - Resume scoring / matching against job
  - Changes to profile endpoints or profile data model (profile is read-only input)
  - Changes to the existing CV analyzer (`ResumeAnalyzer`, `PdfTextExtractor`)
  - Mobile UI changes (Spec: `mobile-resume-experience`)
  - Job external URL plumbing (Spec: `job-external-url`)
  - Spring Boot upgrade (stay on 3.3.5)
- **Adjacent expectations**:
  - `ProfileResponse` loses the `applicationsCount` field when `ApplicationRepository` is deleted; `ProfileService.toResponse()` stops computing it. This is an adjacent impact on `mobile-resume-experience` and `perfectjob-admin` consumers who read that field — they must handle its absence. This spec does not own those consumers but documents the breaking change.
  - `job-external-url` spec claims Flyway V9; this spec uses V10. If merge order changes, renumber accordingly.
  - `ProfileService` currently injects `ApplicationRepository` for the applications count — that injection is removed here.

## Requirements

### Requirement 1: LLM Integration via LangChain4j

**Objective:** As a backend developer, I want to integrate an LLM provider into the API so that resume content can be generated from candidate profile and job data.

#### Acceptance Criteria

1. The API shall include the `langchain4j` and `langchain4j-open-ai` core Maven dependencies (not the Spring Boot starter) in `pom.xml`.
2. The API shall expose an `OpenAiChatModel` bean configured with a base URL, a model name, and an API key, wired manually in a `@Configuration` class (no auto-configuration).
3. The base URL shall default to `https://openrouter.ai/api/v1` and be overridable via the `OPENROUTER_BASE_URL` environment variable.
4. The model name shall default to `deepseek/deepseek-chat` and be overridable via the `OPENROUTER_MODEL` environment variable.
5. The API key shall be read from the `OPENROUTER_API_KEY` environment variable.
6. If the `OPENROUTER_API_KEY` environment variable is not set, the API shall start successfully but resume generation requests shall return a clear error indicating the key is missing.

### Requirement 2: Structured LLM Output for Resume Content

**Objective:** As a candidate, I want the LLM to produce structured, job-tailored resume content so that my resume highlights the most relevant skills and experiences for each job.

#### Acceptance Criteria

1. When a resume generation is requested for a job, the system shall send the candidate's profile data and the job's requirements to the LLM with a system prompt instructing it to return structured JSON content in Portuguese (pt-BR).
2. The system shall use a LangChain4j `AiServices` typed interface that returns a structured record containing at minimum: a professional summary, tailored experience descriptions (bullet points), and prioritized skills.
3. The LLM shall never be asked to produce LaTeX syntax; it shall only provide content fields.
4. If the LLM response cannot be parsed into the structured record, the system shall retry the LLM call at most once before returning an error.
5. If the retry also fails, the system shall return a user-facing error indicating resume content generation failed.

### Requirement 3: LaTeX Template Building

**Objective:** As a candidate, I want my generated resume to follow a fixed, professionally formatted LaTeX template so that the PDF is visually consistent and compilation is reliable.

#### Acceptance Criteria

1. The system shall build a complete LaTeX document string deterministically in Java from the structured LLM content and the candidate's profile data.
2. The LaTeX template shall use a fixed structure based on the `article` document class with the `helvet` package and custom commands (`\cvsection`, `\job`, `\company`, `\simpleline`, `cvcontent` environment).
3. The template shall use the defined brand colors: text gray (`#565656`) and rule gray (`#8A8A8A`).
4. The system shall escape all special LaTeX characters in candidate-provided and LLM-generated content to prevent compilation errors.
5. The template builder shall be unit-testable independently of the LLM and PDF compilation.

### Requirement 4: PDF Compilation via Tectonic

**Objective:** As a candidate, I want the system to compile my LaTeX resume into a PDF so that I can download and share it.

#### Acceptance Criteria

1. The system shall invoke the tectonic binary via `ProcessBuilder` to compile the `.tex` source into a PDF.
2. The path to the tectonic binary shall be configurable via the `TECTONIC_PATH` environment variable with a default of `/usr/local/bin/tectonic`.
3. The system shall enforce a compilation timeout (configurable, default 120 seconds); if exceeded, the system shall destroy the process and return an error.
4. If tectonic exits with a non-zero code, the system shall capture the stderr output and return an error indicating compilation failure with the LaTeX error details.
5. If the tectonic binary is not found at the configured path, the system shall return a clear error guiding installation.

### Requirement 5: Resume Entity and Storage

**Objective:** As a candidate, I want my generated resumes to be persisted and associated with the job they were created for, so that I can retrieve them later.

#### Acceptance Criteria

1. The system shall persist a `Resume` entity with fields: `id`, `userId`, `jobId`, `pdfStoragePath`, `latexSource` (TEXT), `createdAt`, `updatedAt`.
2. The system shall store the generated PDF file on the filesystem under a configurable directory (default `data/resumes/{userId}/{resumeId}.pdf`).
3. The storage directory shall be created on application startup if it does not exist.
4. The Flyway migration shall create the `resumes` table as version V10 (coordinating with `job-external-url` which uses V9).
5. The `pdfStoragePath` column shall store the absolute or relative path to the PDF file for later streaming.

### Requirement 6: Resume Generation REST API

**Objective:** As a candidate, I want REST endpoints to generate, list, view, download, and delete my resumes so that I can manage my tailored resumes.

#### Acceptance Criteria

1. When an authenticated candidate sends `POST /v1/resumes` with a body containing `jobId`, the system shall generate a tailored resume and return a `ResumeResponse` with the resume metadata.
2. When an authenticated candidate sends `GET /v1/resumes`, the system shall return a paginated list of the candidate's resumes.
3. When an authenticated candidate sends `GET /v1/resumes/{id}`, the system shall return resume details including the associated job's title and description.
4. When an authenticated candidate sends `GET /v1/resumes/{id}/pdf`, the system shall stream the PDF file with the appropriate content type.
5. When an authenticated candidate sends `DELETE /v1/resumes/{id}`, the system shall delete the resume record and the associated PDF file from the filesystem.
6. If a candidate attempts to access or delete a resume they do not own, the system shall return a `403 Forbidden` error.
7. If the requested job does not exist, the system shall return a `404 Not Found` error before attempting generation.
8. The system shall enforce that only authenticated candidates can access resume endpoints ( recruiters and admins are not resume generators).

### Requirement 7: Application System Removal

**Objective:** As a developer, I want the entire Application system removed so that the codebase reflects the pivot from in-platform applications to resume generation.

#### Acceptance Criteria

1. The Flyway migration V10 shall drop the `applications` table.
2. The system shall delete the `Application` entity, `ApplicationController`, `ApplicationService`, `ApplicationRepository`, `ApplicationMapper`, `ApplicationSubmittedEvent`, `ApplicationStatus` enum, `SubmitApplicationRequest` DTO, `UpdateApplicationStatusRequest` DTO, and `ApplicationResponse` DTO.
3. The `ProfileService` shall stop referencing `ApplicationRepository` and shall no longer compute or return an `applicationsCount`.
4. The `ProfileResponse` record shall have the `applicationsCount` field removed.
5. The `NotificationService` methods used exclusively for application-status changes (`notifyApplicationStatusChange`) shall be removed if no other caller remains.
6. The application shall compile and start successfully after all Application-related code is removed.

### Requirement 8: Docker and Infrastructure Setup

**Objective:** As a developer, I want the infrastructure configured for tectonic so that PDF compilation works in the Docker deployment.

#### Acceptance Criteria

1. The `start.sh` script (or Docker setup) shall download and install the tectonic static binary for x86_64 Linux when running in Docker mode.
2. The infrastructure setup shall warm the tectonic font/asset cache during startup by compiling a trivial `.tex` document.
3. The `.env.example` file shall document the new environment variables: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_BASE_URL`, `TECTONIC_PATH`, and resume storage directory.
4. The `application.yml` shall include a `perfectjob.resume` namespace with configurable storage directory, tectonic path, and compilation timeout.

### Requirement 9: Error Handling for External Dependencies

**Objective:** As a candidate, I want meaningful error messages when external dependencies fail so that I understand what went wrong.

#### Acceptance Criteria

1. If the LLM provider is unreachable or returns an HTTP error, the system shall return a `502 Bad Gateway` with a message indicating the AI service is temporarily unavailable.
2. If the LLM response is malformed after retry, the system shall return a `500 Internal Server Error` with a message indicating content generation failed.
3. If tectonic compilation fails (non-zero exit code), the system shall return a `500 Internal Server Error` with the LaTeX error excerpt.
4. If the tectonic binary is not found, the system shall return a `500 Internal Server Error` with guidance to install tectonic.
5. If the PDF file is missing from the filesystem when streaming is requested, the system shall return a `404 Not Found` error.
6. If the filesystem is unwritable when saving a PDF, the system shall return a `500 Internal Server Error` with a message indicating storage failure.
