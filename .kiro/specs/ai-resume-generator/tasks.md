# Implementation Plan

- [x] 1. Foundation: Maven dependencies, configuration, entity, and migration
- [x] 1.1 Add LangChain4j core dependencies to the Maven build
  - Add a `langchain4j.version` property (1.x line) to `pom.xml` properties
  - Add `dev.langchain4j:langchain4j-open-ai` and `dev.langchain4j:langchain4j` as compile dependencies (NOT the spring-boot-starter)
  - Run `./mvnw compile` — the project compiles with the new dependencies on the classpath
  - _Requirements: 1.1_

- [x] 1.2 Add resume generation configuration namespace and environment variables
  - Add `perfectjob.resume` namespace to `application.yml` with sub-keys: `storage-dir` (default `data/resumes`), `tectonic.path` (default `/usr/local/bin/tectonic`), `tectonic.compile-timeout-seconds` (default `120`), `openrouter.base-url` (default `https://openrouter.ai/api/v1`), `openrouter.model` (default `deepseek/deepseek-chat`), `openrouter.api-key` (from `OPENROUTER_API_KEY` env, default empty)
  - Add new environment variables to `.env.example`: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_BASE_URL`, `TECTONIC_PATH`, `PERFECTJOB_RESUME_STORAGE_DIR`
  - The configuration is resolvable at startup with sensible defaults except the API key (which degrades gracefully)
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 4.2, 8.4_

- [x] 1.3 Create the Resume entity and repository
  - Create `Resume.java` entity in `model/` with fields: `id`, `userId`, `jobId`, `pdfStoragePath` (VARCHAR 1024), `latexSource` (TEXT), `createdAt`, `updatedAt`; use Lombok `@Data @Builder @NoArgsConstructor @AllArgsConstructor`, JPA `@Entity @Table(name = "resumes")`, Hibernate `@CreationTimestamp` / `@UpdateTimestamp`
  - Create `ResumeRepository.java` in `repository/` extending `JpaRepository<Resume, Long>` with `findByUserIdOrderByCreatedAtDesc` and `findByIdAndUserId` methods
  - The entity compiles and the repository interface is recognized by Spring Data JPA
  - _Requirements: 5.1, 5.5_

- [x] 1.4 Create Flyway migration V10 for resumes table and applications table drop
  - Create `V10__add_resumes_drop_applications.sql` in `db/migration/` that creates the `resumes` table (BIGSERIAL id, user_id FK with ON DELETE CASCADE, job_id FK, pdf_storage_path VARCHAR(1024), latex_source TEXT, created_at, updated_at) with indexes on `user_id` and `(user_id, job_id)`, then executes `DROP TABLE IF EXISTS applications`
  - Document in a SQL comment that V9 is reserved for `job-external-url` spec; renumber if merge order changes
  - The migration SQL is syntactically valid and follows the existing migration comment/header style
  - _Requirements: 5.4, 7.1_
  - _Depends: 12.1_

- [x] 2. Core pipeline components (parallel-capable)
- [x] 2.1 (P) Create LangChain4j configuration with manual bean wiring
  - Create `config/LangChain4jConfig.java` as a `@Configuration` class reading properties from the `perfectjob.resume.openrouter.*` namespace via `@Value`
  - Define `@Bean OpenAiChatModel openAiChatModel()` configured with `baseUrl`, `apiKey`, `modelName`, `temperature(0.7)`, and `timeout(Duration.ofSeconds(60))`
  - Define `@Bean ResumeContentAiService resumeContentAiService(OpenAiChatModel model)` using `AiServices.builder(ResumeContentAiService.class).chatLanguageModel(model).build()`
  - If the API key is blank, the beans are still created (lazy failure at call time)
  - The application context starts successfully with these beans registered
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - _Boundary: LangChain4jConfig_

- [x] 2.2 (P) Create the LLM structured content types, AiServices interface, and system prompt
  - Create `TailoredResumeContent.java` record in `service/resume/generate/` with fields: `professionalSummary` (String), `highlightedSkills` (List\<String\>), `tailoredExperiences` (List\<TailoredExperience\>)
  - Create `TailoredExperience.java` record with fields: `title`, `company`, `startDate`, `endDate`, `bulletPoints` (List\<String\>)
  - Create `ResumeContentAiService.java` interface in `service/resume/generate/` with a method annotated `@SystemMessage` pointing to a resource file containing the pt-BR system prompt that instructs the LLM to produce JSON matching the `TailoredResumeContent` schema with a few-shot example
  - Create the system prompt resource file under `src/main/resources/` (e.g., `prompts/resume-content-system-prompt.txt`) in Portuguese (pt-BR), specifying the JSON schema and a few-shot example; the prompt explicitly forbids LaTeX output
  - The interface and records compile; the prompt file is loadable as a classpath resource
  - _Requirements: 2.1, 2.2, 2.3_
  - _Boundary: ResumeContentAiService, TailoredResumeContent_

- [x] 2.3 (P) Create the LaTeX template builder
  - Create `LatexTemplateBuilder.java` in `service/resume/generate/` as a `@Component` with a `build(TailoredResumeContent content, ProfileResponse profile)` method returning a complete `.tex` string
  - Use Java text blocks for the fixed template skeleton: `\documentclass{article}`, `\usepackage{helvet}`, custom commands (`\cvsection`, `\job`, `\company`, `\simpleline`, `cvcontent` environment), and the defined brand colors (`\definecolor{textgray}{HTML}{565656}`, `\definecolor{rulegray}{HTML}{8A8A8A}`)
  - Implement a private `escapeLatex(String)` method that escapes all LaTeX special characters (`&`, `%`, `$`, `#`, `_`, `{`, `}`, `~`, `^`, `\`) in dynamic content
  - Populate the template sections from `TailoredResumeContent` (summary, highlighted skills, tailored experiences with bullet points) and `ProfileResponse` (name, contact info, education, languages)
  - The builder takes pure data in and returns a string with no I/O; it can be unit-tested independently
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - _Boundary: LatexTemplateBuilder_

- [x] 2.4 (P) Create the tectonic PDF compiler
  - Create `TectonicPdfCompiler.java` in `service/resume/generate/` as a `@Component` with a `compile(String latexSource)` method returning `byte[]`
  - Read the tectonic binary path and timeout from the `perfectjob.resume.tectonic.*` config namespace
  - Write the latex source to a temp `.tex` file, invoke `new ProcessBuilder(tectonicPath, "--outdir", tempDir, texFile)` with `redirectErrorStream(true)`, and enforce the configurable timeout via `process.waitFor(timeout, TimeUnit.SECONDS)`
  - On exit code 0: read the resulting `.pdf` bytes from the temp dir, clean up temp files, return bytes
  - On non-zero exit: capture stderr, clean up temp files, throw `PdfCompilationException` with the error excerpt
  - On `IOException` (binary not found): throw `TectonicNotFoundException` with install guidance
  - On timeout: call `process.destroyForcibly()`, throw `PdfCompilationException`
  - The compiler produces valid PDF bytes when given valid LaTeX and tectonic is available; throws typed exceptions on all failure modes
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - _Boundary: TectonicPdfCompiler_

- [x] 2.5 (P) Create resume generation exception classes
  - Create `ResumeGenerationException.java` in `exception/` as a base `RuntimeException` subclass
  - Create `LlmServiceUnavailableException`, `ResumeContentException`, `PdfCompilationException`, and `TectonicNotFoundException` as subclasses of `ResumeGenerationException`
  - Add `@ExceptionHandler` methods to `GlobalExceptionHandler` for `LlmServiceUnavailableException` (→ 502) and the remaining `ResumeGenerationException` subtypes (→ 500 with specific messages)
  - The exception classes compile and are wired into the global handler; error responses have the correct HTTP status codes
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6_
  - _Boundary: exception package, GlobalExceptionHandler_

- [x] 3. Integration: resume generation orchestration and REST API
- [x] 3.1 Create the resume generation orchestration service
  - Create `ResumeGenerationService.java` in `service/resume/generate/` as a `@Service` with a `generate(ProfileResponse profile, Job job)` method
  - Call `ResumeContentAiService.generateTailoredContent(...)` with the profile and job data serialized as context strings; on parsing failure, retry once; on second failure, throw `ResumeContentException`
  - Pass the structured content and profile to `LatexTemplateBuilder.build(...)` to get the LaTeX source
  - Pass the LaTeX source to `TectonicPdfCompiler.compile(...)` to get the PDF bytes
  - Write the PDF to the storage directory under `{storage-dir}/{userId}/{resumeId}.pdf` (create directories as needed); on write failure, throw `StorageException`
  - Return a `GenerationResult` record containing `latexSource` and `pdfStoragePath`
  - The service successfully orchestrates the full pipeline end-to-end when all components are functional
  - _Requirements: 2.4, 2.5, 5.2, 5.3, 9.6_
  - _Depends: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.2 Create resume DTOs and the resume service layer
  - Create `GenerateResumeRequest.java` record in `dto/request/` with a `@NotNull Long jobId` field
  - Create `ResumeResponse.java` record in `dto/response/` with fields: `id`, `jobId`, `jobTitle`, `pdfStoragePath`, `createdAt`, `updatedAt`
  - Create `ResumeDetailResponse.java` record in `dto/response/` with fields: `id`, `jobId`, `jobTitle`, `jobDescription`, `pdfStoragePath`, `latexSource`, `createdAt`, `updatedAt`
  - Create `ResumeService.java` in `service/` as a `@Service` with methods: `generate(userId, request)`, `listByUser(userId, pageable)`, `getDetail(userId, resumeId)`, `getPdf(userId, resumeId)`, `delete(userId, resumeId)`
  - The `generate` method validates the job exists (404 if not), loads the profile via `ProfileService`, calls `ResumeGenerationService`, and persists the `Resume` entity
  - The `getDetail` method loads the resume and the associated job (for title + description)
  - The `delete` method verifies ownership, deletes the PDF file (best-effort), then deletes the DB record
  - The `getPdf` method verifies ownership and returns the PDF file as a `Resource`
  - All methods enforce ownership: `resume.getUserId().equals(userId)` → 403 on mismatch
  - The service compiles and all CRUD methods return the correct DTO types
  - _Requirements: 5.1, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 9.5, 9.6_
  - _Depends: 1.3, 3.1_

- [x] 3.3 Create the resume REST controller
  - Create `ResumeController.java` in `controller/v1/` with `@RequestMapping("/v1/resumes")` and `@RequiredArgsConstructor`
  - `POST /v1/resumes` — `@PreAuthorize("isAuthenticated()")`, accepts `@Valid @RequestBody GenerateResumeRequest`, resolves the current user via `CurrentUserResolver`, delegates to `ResumeService.generate`, returns `ResponseEntity<ResumeResponse>`
  - `GET /v1/resumes` — returns `ResponseEntity<Page<ResumeResponse>>` via `ResumeService.listByUser`
  - `GET /v1/resumes/{id}` — returns `ResponseEntity<ResumeDetailResponse>` via `ResumeService.getDetail`
  - `GET /v1/resumes/{id}/pdf` — returns `ResponseEntity<Resource>` with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="resume.pdf"` header
  - `DELETE /v1/resumes/{id}` — returns `ResponseEntity<Void>` with status 204
  - The controller is thin (no business logic); all endpoints are reachable and return the correct response types
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_
  - _Depends: 3.2_

- [x] 4. Application system removal and profile updates
- [x] 4.1 Remove all Application-related code and update ProfileService
  - Delete `model/Application.java`, `controller/v1/ApplicationController.java`, `service/ApplicationService.java`, `repository/ApplicationRepository.java`, `service/mapper/ApplicationMapper.java`, `event/ApplicationSubmittedEvent.java`, `model/enums/ApplicationStatus.java`, `dto/request/SubmitApplicationRequest.java`, `dto/request/UpdateApplicationStatusRequest.java`, `dto/response/ApplicationResponse.java`
  - Update `ProfileService.java`: remove the `ApplicationRepository` field injection, remove the `applicationsCount` computation in `toResponse()`, remove the `applicationsCount` parameter from the `ProfileResponse` constructor call
  - Update `ProfileResponse.java`: remove the `applicationsCount` field from the record
  - Remove the `notifyApplicationStatusChange` method from `NotificationService` if no other caller remains (check with grep)
  - The project compiles and starts successfully with no references to Application classes or the applications table
  - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 5. Infrastructure and validation
- [x] 5.1 Update start.sh for tectonic installation and font cache warming
  - In the Docker-mode branch of `start.sh` (the `else` block where Java is not found on the host), add a step that downloads the tectonic static binary for x86_64 Linux into the container, makes it executable, and runs a trivial `tectonic` compilation to warm the font/asset cache
  - Set the `TECTONIC_PATH` environment variable in the Docker run command to point to the installed binary
  - Mount or create a volume for the `data/resumes/` directory so generated PDFs persist across container restarts
  - The Docker-mode API container starts with tectonic available and font cache warmed; `tectonic --version` succeeds inside the container
  - _Requirements: 8.1, 8.2, 8.3_
  - _Depends: 1.2_

- [x] 5.2 Write unit tests for the LaTeX template builder and tectonic compiler
  - Write unit tests for `LatexTemplateBuilder`: given a fixed `TailoredResumeContent` + `ProfileResponse`, assert the output contains expected sections (`\cvsection`, `\job`, `\company`), brand colors (`565656`, `8A8A8A`), and that all LaTeX special characters are escaped in dynamic content
  - Write unit tests for `escapeLatex` covering each special character (`&`, `%`, `$`, `#`, `_`, `{`, `}`, `~`, `^`, `\`)
  - Write unit tests for `TectonicPdfCompiler` using a mocked process: assert exit code 0 returns non-empty bytes, non-zero exit throws `PdfCompilationException` with stderr, timeout triggers `destroyForcibly`
  - All unit tests pass via `./mvnw test`
  - _Requirements: 3.5, 4.3, 4.4, 4.5_
  - _Boundary: LatexTemplateBuilder, TectonicPdfCompiler_

- [x] 5.3 Write integration tests for the resume service and controller
  - Write Spring Boot integration tests for `ResumeController` using `@SpringBootTest` + H2: assert POST `/v1/resumes` returns 200 with a `ResumeResponse` body, GET list returns a page, GET detail returns job info, GET pdf streams bytes with `application/pdf` content type, DELETE returns 204
  - Assert ownership enforcement: user B requesting user A's resume returns 403
  - Assert job-not-found returns 404 on POST
  - Mock the LLM and tectonic components via `@MockBean` to isolate the HTTP/integration layer
  - All integration tests pass via `./mvnw test`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_
  - _Depends: 3.3, 4.1_

- [x] 5.4* Write unit tests for the resume generation orchestration with retry logic
  - Write unit tests for `ResumeGenerationService` with mocked sub-components: assert happy-path returns a `GenerationResult` with latex source and pdf path; assert that a malformed LLM response on the first attempt triggers a retry; assert that a second consecutive failure throws `ResumeContentException`
  - Assert that a tectonic compilation failure propagates `PdfCompilationException` without retry
  - All tests pass via `./mvnw test`
  - _Requirements: 2.4, 2.5, 9.2_
  - _Depends: 3.1_

- [ ] 6. Phase 2 — Core pipeline changes (R10, R11, R12, R13)
- [x] 6.1 (P) Strengthen the LLM system prompt with tailoring rules and canonical skill categories
  - Read the current `prompts/resume-content-system-prompt.txt` to understand the existing structure and JSON schema
  - Add at least three distinct rules requiring adaptation to the target job: (1) the `professionalSummary` must reference at least one concrete element from the job's title, required skills, or description; (2) experience bullet points must be rephrased (not copied verbatim) to highlight achievements relevant to the job's requirements; (3) the categorized skills list must contain only skills the candidate has AND that are relevant to the job, ordered by relevance
  - Add the five canonical category names ("Linguagens", "Frameworks", "Bancos de Dados", "Ferramentas e Plataformas", "Metodologias") with an explicit instruction that the LLM use only these names and omit any category that would have zero items
  - The prompt file content matches the new requirements when read back; can be inspected via `cat` and the prompt file remains valid JSON schema with a few-shot example
  - _Requirements: 10.1, 10.2, 10.3, 11.2, 11.3, 11.4_
  - _Boundary: system prompt resource, ResumeContentAiService_

- [x] 6.2 (P) Replace `highlightedSkills` with `categorizedSkills` in `TailoredResumeContent`
  - Add a new `CategorizedSkill(String category, List<String> items)` record in the same file (`service/resume/generate/TailoredResumeContent.java`)
  - Remove the `List<String> highlightedSkills` field from the `TailoredResumeContent` record
  - Add a new `List<CategorizedSkill> categorizedSkills` field in its place
  - Update the call site in `LatexTemplateBuilder.build(...)` to use the new field
  - The project compiles; the new `CategorizedSkill` record exists; the old `highlightedSkills` field is gone; no API/DTO/persisted state references `highlightedSkills`
  - _Requirements: 11.1_
  - _Boundary: TailoredResumeContent_

- [x] 6.3 Update `LatexTemplateBuilder` for categorized skills, the languages section, and visual section spacing
  - Change `writeSkills` to accept `List<CategorizedSkill>` and render categories in the fixed order Linguagens → Frameworks → Bancos de Dados → Ferramentas e Plataformas → Metodologias, skipping any category that is missing or has zero items
  - Add a new `writeLanguages(List<LanguageDto>)` method that renders the "Idiomas" section using the same `section()` helper as the other sections; render each entry as `Language (Level)` in the order they appear in the profile; omit the entire method call when the list is null or empty
  - Call `writeLanguages` from `build()` after `writeEducation` and before `writeFooter`
  - Update `section()` to emit a small `\vspace` (e.g., `0.10cm`) after the `\hrule` so body content does not touch the rule; have each section writer append a `\vspace` (e.g., `0.20cm`) at the end of its body so the next section's heading has breathing room
  - Use conservative vspace values so a typical 1-page resume (header + summary + categorized skills + 2-3 experiences + education + languages) still fits on one A4 page
  - The existing `LatexTemplateBuilderTest` is updated to construct `TailoredResumeContent` with `categorizedSkills` instead of `highlightedSkills` and continues to pass
  - The generated LaTeX source visibly contains vspace tokens between sections and an "IDIOMAS" section when languages are present in the profile
  - _Requirements: 11.5, 11.6, 12.1, 12.2, 12.3, 12.4, 12.5, 13.1, 13.2, 13.3, 13.4_
  - _Boundary: LatexTemplateBuilder_
  - _Depends: 6.2_

- [ ] 7. Phase 2 — Tests for the new behaviors
- [x] 7.1 Extend `LatexTemplateBuilderTest` for categorized skills, languages, and spacing
  - Update the existing `sampleTailoredContent` helper to construct a `TailoredResumeContent` with the new `categorizedSkills` field
  - Add a test that asserts the rendered LaTeX contains the five category headings in canonical order: Linguagens, Frameworks, Bancos de Dados, Ferramentas e Plataformas, Metodologias
  - Add a test that asserts categories with zero items (e.g., a candidate with no databases) are absent from the output
  - Add a test that asserts the "IDIOMAS" section is present in the output when `profile.languages` is non-empty, with each entry rendered as `Language (Level)` in the order provided
  - Add a test that asserts the "IDIOMAS" section is absent when `profile.languages` is null or empty
  - Add a test that asserts `\vspace` tokens appear between every section's content and the next section's heading, and immediately after every `\hrule`
  - All new tests pass via `./mvnw test -Dtest=LatexTemplateBuilderTest`
  - _Requirements: 11.5, 11.6, 12.1, 12.2, 12.3, 12.4, 12.5, 13.1, 13.2, 13.3, 13.4_
  - _Boundary: LatexTemplateBuilder, LatexTemplateBuilderTest_
  - _Depends: 6.3_

- [ ] 7.2 (P) Extend `ResumeGenerationServiceTest` to assert R10.5 (LLM call receives both profile and job)
  - Add a test that mocks `ResumeContentAiService`, calls `generate(profile, job)`, and captures the argument values passed to the AI service
  - Assert that both the profile JSON and the job context are non-empty in the captured call (the system must not generate resume content from the profile alone)
  - All new tests pass via `./mvnw test -Dtest=ResumeGenerationServiceTest`
  - _Requirements: 10.5_
  - _Boundary: ResumeGenerationService, ResumeGenerationServiceTest_

- [ ] 7.3 Add a prompt content test for R10.3 (≥3 tailoring rules in the prompt file)
  - Create a new test class (e.g., `ResumeContentPromptTest` in `service/resume/generate/`) that loads the `prompts/resume-content-system-prompt.txt` resource as a `String` via `getClass().getResourceAsStream(...)`
  - Assert that the prompt content contains at least three distinct tailoring-related instructions (regex for keywords like "mencione", "adapte", "reformule", "referencie", OR a structural count of rule bullets in a designated "Regras" section)
  - The test passes via `./mvnw test -Dtest=ResumeContentPromptTest`
  - _Requirements: 10.3_
  - _Boundary: system prompt resource, ResumeContentPromptTest (new)_
  - _Depends: 6.1_

- [ ] 7.4* Add a manual E2E test for R10.4 (two different jobs → different summaries)
  - Create a test gated by the `OPENROUTER_API_KEY` environment variable; skip cleanly via `Assumptions.assumeTrue(...)` when the key is missing
  - Use the real LLM (no mocks) to generate two resumes for the same candidate profile but two different jobs
  - Assert that the two generated `professionalSummary` texts differ in at least one of: wording, mentioned technologies, or mentioned achievements
  - Marked as optional (manual E2E, slow, requires real LLM credentials, not part of CI)
  - _Requirements: 10.4_
  - _Boundary: ResumeGenerationService_
  - _Depends: 6.1, 6.2, 6.3_
