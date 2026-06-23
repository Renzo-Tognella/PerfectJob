# Requirements Document

## Introduction

PerfectJob is pivoting its candidate-facing mobile flow from in-platform "submit application" to "generate tailored resume". The mobile app's candidate flow is built around a "Candidaturas" tab listing submitted applications and a "Candidatar-se" button on the job detail screen. With the shift to AI resume generation, the entire candidate-facing experience must change: the tab becomes "Currículos" listing generated resumes, the job detail button becomes "Gerar Currículo" triggering server-side generation, and a new PDF preview screen lets the candidate view their generated resume.

The mobile app is a pure consumer of the `/v1/resumes` REST API defined by the `ai-resume-generator` spec. It performs no generation logic locally. When a candidate taps "Gerar Currículo" on a job, the app sends `POST /v1/resumes { jobId }` and waits synchronously (10-30 seconds) for the generated `ResumeResponse`. The candidate can then browse their generated resumes in the "Currículos" tab, preview any resume as a PDF, and optionally open the job's original external URL to apply on the source platform.

This spec owns all mobile-side changes: navigation reconfiguration, screen rework (list, detail, preview), TypeScript types mirroring the API contracts, the resume API service module, TanStack Query hooks, PDF rendering in the Expo Go runtime, and the removal of all application-related code. All UI text is in Portuguese (pt-BR).

## Boundary Context

- **In scope**:
  - Rename the "Candidaturas" bottom tab to "Currículos" and point it at a new ResumesScreen
  - Replace the ApplicationsScreen with a ResumesScreen that lists generated resumes
  - Rework the JobDetailScreen: change the bottom button from "Candidatar-se" to "Gerar Currículo", wire it to resume generation, and add the external job link
  - Add a ResumePreviewScreen that renders the generated PDF and offers navigation back
  - Add `externalUrl` to the mobile `JobResponse` mirror type, the domain `Job` type, and the `toJob` mapper
  - Create the resume API service module (`POST`, `GET` list, `GET` detail, `GET` pdf, `DELETE`)
  - Create TanStack Query hooks for resumes (list, generate, pdf, delete)
  - Remove all application-related code (types, service, hooks, screen, mapper entries)
  - Add `expo-file-system` dependency for PDF download
- **Out of scope**:
  - Resume generation backend (Spec: `ai-resume-generator` — owns the LLM, LaTeX, tectonic pipeline and all server-side logic)
  - Database schema, migrations, entity changes (backend concerns)
  - Resume editing after generation (regenerate instead)
  - Offline resume caching beyond TanStack Query's default cache
  - Push notifications for generation completion (synchronous generation)
  - Share/forward resume PDF (future)
  - Admin web application changes (admin loses application tracking — academic scope decision)
  - PDF annotation or in-app editing
- **Adjacent expectations**:
  - The `ai-resume-generator` spec defines the `ResumeResponse`, `ResumeDetailResponse`, and `GenerateResumeRequest` shapes. This spec's mobile types MUST match those shapes exactly. If the upstream API contract changes, the mobile types must be revalidated.
  - The `ai-resume-generator` spec removes `applicationsCount` from `ProfileResponse`. If the mobile `ProfileScreen` or profile types reference this field, they must tolerate its absence. This is an adjacent impact documented here but not owned by this spec.
  - The `job-external-url` spec adds `externalUrl` to the backend `JobResponse`. This spec adds the corresponding mobile-side field and display because the JobDetailScreen is already being reworked. If `job-external-url` is implemented independently, the mobile type additions here may already be present — coordinate to avoid duplicate edits.

## Requirements

### Requirement 1: Bottom Tab Rename from Candidaturas to Currículos

**Objective:** As a candidate, I want the bottom tab to say "Currículos" instead of "Candidaturas", so that the navigation reflects the new resume-generation flow rather than the old application flow.

#### Acceptance Criteria

1. The bottom tab navigator shall display the label "Currículos" for the resume list tab.
2. The tab shall use the `document-text` / `document-text-outline` icon pair (unchanged from the current Applications tab icon).
3. The tab shall navigate to the ResumesScreen when tapped.
4. The `TabParamList` type shall rename the `Applications` route to `Resumes`.
5. The tab shall retain the active/inactive tint colors from the existing design tokens (`colors.primary[500]` active, `colors.neutral[500]` inactive).

### Requirement 2: Resumes List Screen

**Objective:** As a candidate, I want to see a list of my generated resumes, so that I can browse and revisit resumes I have created for different jobs.

#### Acceptance Criteria

1. The ResumesScreen shall display a paginated `FlatList` of generated resumes fetched from `GET /v1/resumes`.
2. Each resume card shall display the job title, the generation date (formatted in pt-BR), and a "Ver PDF" button.
3. When the candidate taps a resume card or its "Ver PDF" button, the app shall navigate to the ResumePreviewScreen with the resume's `id` as a route parameter.
4. When the resume list is empty, the screen shall display an empty state with the message "Nenhum currículo gerado" and guidance text encouraging the candidate to explore jobs and generate a resume.
5. While the list is loading for the first time, the screen shall display a loading spinner using `colors.primary[500]`.
6. When the list fails to load, the screen shall display an error state with a "Tentar novamente" button that refetches the data.
7. The screen shall support pull-to-refresh to refetch the resume list.
8. The screen header shall display the title "Meus Currículos".

### Requirement 3: Resume Generation from Job Detail Screen

**Objective:** As a candidate viewing a job, I want to generate a tailored resume for that job by tapping a single button, so that I can get a job-specific PDF resume without leaving the app.

#### Acceptance Criteria

1. The JobDetailScreen bottom sticky button shall display the label "Gerar Currículo" instead of "Candidatar-se".
2. When the candidate taps "Gerar Currículo" and is not authenticated, the app shall show an alert prompting login before generation.
3. When the candidate taps "Gerar Currículo" and is authenticated, the app shall send `POST /v1/resumes` with `{ jobId }` to trigger generation.
4. While the generation request is in progress, the button shall display a loading indicator with the text "Gerando currículo..." and shall be disabled to prevent duplicate submissions.
5. When generation succeeds, the app shall navigate to the ResumePreviewScreen with the returned resume `id` and shall invalidate the resumes list cache.
6. When generation fails, the app shall display an error alert with a human-readable message extracted from the API error response.
7. The generation request shall use a timeout of at least 120 seconds to accommodate the server-side LLM and LaTeX compilation pipeline.

### Requirement 4: Resume PDF Preview Screen

**Objective:** As a candidate, I want to view my generated resume as a PDF within the app, so that I can review the tailored content before using it to apply for the job.

#### Acceptance Criteria

1. The ResumePreviewScreen shall accept a `resumeId` route parameter and fetch the PDF from `GET /v1/resumes/{id}/pdf`.
2. The screen shall render the PDF content within the app using a PDF viewer component.
3. While the PDF is downloading, the screen shall display a loading spinner with the text "Carregando currículo...".
4. When the PDF download fails, the screen shall display an error state with a "Tentar novamente" button.
5. The screen shall display a "Voltar" button that navigates the candidate back to the previous screen.
6. The PDF viewer shall be encapsulated behind a reusable `PdfViewer` component so that the rendering strategy can be swapped without modifying the screen.
7. The PDF rendering approach shall be compatible with Expo Go running in `--offline` mode (no Expo dev client build required).

### Requirement 5: Job External URL Display

**Objective:** As a candidate viewing a job detail, I want to see a link to the original job posting, so that I can apply directly on the source platform after generating my resume.

#### Acceptance Criteria

1. When the job has a non-null `externalUrl`, the JobDetailScreen shall display a "Ver vaga original" link.
2. When the job's `externalUrl` is null or absent, the JobDetailScreen shall not display the external link.
3. When the candidate taps "Ver vaga original", the app shall open the URL in the device's system browser via `Linking.openURL`.
4. The link shall be styled using the `colors.primary[500]` token and shall include an external-link icon.

### Requirement 6: Resume Data Layer (Types, Service, and Hooks)

**Objective:** As a mobile developer, I want properly typed API service modules and React Query hooks for resumes, so that the screens can interact with the `/v1/resumes` endpoints in a type-safe and consistent manner.

#### Acceptance Criteria

1. The mobile app shall define a `ResumeResponse` type matching the API response shape: `{ id, jobId, jobTitle, pdfStoragePath, createdAt, updatedAt }`.
2. The mobile app shall define a `ResumeDetailResponse` type matching the API response shape: `{ id, jobId, jobTitle, jobDescription, pdfStoragePath, latexSource, createdAt, updatedAt }`.
3. The mobile app shall define a `GenerateResumeRequest` type matching the API request shape: `{ jobId: number }`.
4. The resume API service module shall expose methods for: list (paginated), generate, get detail, get PDF URI, and delete.
5. The `useResumes` hook shall use `useInfiniteQuery` with the query key `['resumes', 'list']` following the existing `useMyApplications` pagination pattern.
6. The `useGenerateResume` hook shall use `useMutation` and shall invalidate the `['resumes']` query namespace on success.
7. The `useResumeDetail` hook shall use `useQuery` with the query key `['resumes', 'detail', resumeId]`.
8. The `useDeleteResume` hook shall use `useMutation` and shall invalidate the `['resumes']` query namespace on success.
9. The `JobResponse` mirror type shall include an optional `externalUrl` field, and the `toJob` mapper shall pass it through to the domain `Job` type.

### Requirement 7: Application Code Removal

**Objective:** As a developer, I want all application-related code removed from the mobile app, so that the codebase reflects the pivot from applications to resume generation and contains no dead code.

#### Acceptance Criteria

1. The `src/types/application.ts` file shall be deleted.
2. The `src/services/api/applicationApi.ts` file shall be deleted.
3. The `src/hooks/useApplications.ts` file shall be deleted.
4. The `src/screens/applications/` directory shall be deleted (replaced by the resumes screen).
5. The `ApplicationResponse`, `ApplicationStatus`, `SubmitApplicationRequest`, `ApplicationView`, and `toApplication` exports shall be removed from `mappers.ts`.
6. The `applicationStatusConfig` mapping in `mappers.ts` shall be removed.
7. No file in the mobile app shall import from `applicationApi`, `useApplications`, or `application` types after removal is complete.
8. The mobile app shall compile and pass linting with zero references to application-related modules.

### Requirement 8: Loading, Error, and Empty State Handling

**Objective:** As a candidate, I want clear feedback during long-running operations and when things go wrong, so that I understand what the app is doing and can recover from errors.

#### Acceptance Criteria

1. During resume generation (which may take 10-30 seconds), the app shall display a persistent loading state on the button with descriptive text "Gerando currículo...".
2. If the generation request times out, the app shall display an error message indicating the operation took too long.
3. If the generation API returns a 502 error, the app shall display a message indicating the AI service is temporarily unavailable.
4. If the generation API returns a 404 error, the app shall display a message indicating the job was not found.
5. If the generation API returns a 500 error, the app shall display a generic server error message.
6. The ResumesScreen and ResumePreviewScreen shall each display appropriate loading, error, and empty states consistent with the existing design patterns used in ApplicationsScreen.
7. All user-facing error messages shall be in Portuguese (pt-BR).

### Requirement 9: Backend Connectivity Health Check

**Objective:** As a candidate, I want the app to verify that the backend API is reachable before I try to use resume features, so that I am not stuck with cryptic network errors mid-flow.

#### Acceptance Criteria

1. When the mobile app starts (cold boot, app foreground, or auth-success transition), the app shall issue a lightweight health probe (e.g. `GET /actuator/health` or a known-public endpoint) to the configured `ENV.API_URL`.
2. If the health probe succeeds, the app shall proceed silently with no UI change.
3. If the health probe fails with a network error (DNS, connection refused, timeout), the app shall display a persistent connection banner at the top of the main navigator (above the tab bar, below the status bar) with the message "Sem conexão com o servidor" and a "Tentar novamente" action.
4. The banner shall remain visible while the probe continues to fail and shall auto-dismiss when a subsequent probe succeeds.
5. While the banner is visible, the "Gerar Currículo" button on JobDetailScreen and the "Ver PDF" action on ResumesScreen shall be disabled, and any in-progress resume-generation mutation shall be blocked from starting.
6. The health probe shall be cached for at most 30 seconds so that rapid navigation does not re-probe on every screen mount.
7. The probe URL shall be derived from `ENV.API_URL` (the same base URL used for resume API calls) — no separate configuration.
8. The health probe endpoint shall be reachable without authentication.

### Requirement 10: Robust Resume Generation Flow with Status Awareness

**Objective:** As a candidate, I want resume generation to work reliably even when the backend takes longer than expected, so that I do not see partial results or cryptic errors mid-flow.

#### Acceptance Criteria

1. When the candidate taps "Gerar Currículo", the app shall call `POST /v1/resumes` with a timeout of at least 180 seconds to comfortably accommodate the typical ~68-second backend latency plus cold-start margin.
2. While the mutation is in progress, the JobDetailScreen shall display a non-dismissable progress overlay with the text "Gerando currículo..." and a spinner, replacing the bottom button area.
3. When `POST /v1/resumes` succeeds, the app shall navigate to ResumePreviewScreen with the returned resume `id` and shall invalidate the resumes list cache.
4. When `POST /v1/resumes` fails with a 408 or axios timeout (`ECONNABORTED`), the app shall display an error message indicating the operation took too long and offer a "Tentar novamente" action that re-issues the request.
5. When `POST /v1/resumes` fails with a 502 or 503, the app shall display a message indicating the AI service is temporarily unavailable and offer a "Tentar novamente" action.
6. When `POST /v1/resumes` fails with a network error (DNS, connection refused), the app shall display a message indicating connection problems and a "Tentar novamente" action.
7. The mutation `onSuccess` callback shall not perform any additional navigation if the navigation stack is already at the ResumePreviewScreen (idempotent).
8. The mutation `onError` callback shall surface the error via an `Alert.alert` with the human-readable message extracted from the API response, never a raw axios error.

### Requirement 11: JWT 401 Reauth CTA on PDF Download Failure

**Objective:** As a candidate whose session token has expired, I want a clear path to re-authenticate when the PDF download fails, so that I am not stuck in an error loop.

#### Acceptance Criteria

1. When the `PdfViewer` component fetches the PDF and the response is 401, the viewer shall display an error state with the message "Sessão expirada. Faça login novamente." and a "Fazer login" button.
2. The "Fazer login" button shall clear the auth store, navigate to the `Login` screen, and remove the `ResumePreview` route from the navigation stack.
3. When the `PdfViewer` component fetches the PDF and the response is 403, the viewer shall display an error state with the message "Você não tem permissão para visualizar este currículo." and a "Voltar" button.
4. When the `PdfViewer` component fetches the PDF and the response is 404, the viewer shall display an error state with the message "Currículo não encontrado." and a "Voltar" button.
5. When the `PdfViewer` component fetches the PDF and the response is 5xx or a network error, the viewer shall display an error state with a "Tentar novamente" button that re-issues the download.
6. The `PdfViewer` component shall accept an `onError` callback prop, and the parent `ResumePreviewScreen` shall wire this prop to the error-handling logic above (currently the prop is declared but not wired).
7. The `ResumePreviewScreen` shall not attempt to recover from a 401 silently — the user must explicitly initiate re-login.

### Requirement 12: PDF Content-Type Validation

**Objective:** As a candidate, I want the PDF viewer to validate that the downloaded file is actually a PDF, so that I never see a blank or broken screen caused by rendering an HTML error page or empty response.

#### Acceptance Criteria

1. When the `PdfViewer` component downloads the PDF via `FileSystem.downloadAsync`, the component shall inspect the response `Content-Type` header.
2. If the `Content-Type` header is missing or is not `application/pdf` (case-insensitive), the viewer shall treat the response as an error and surface the error state described in Requirement 11.
3. The viewer shall also verify that the downloaded file size is greater than zero bytes; a 200 response with zero-byte body shall be treated as an error.
4. The `resumeApi.getPdfUri` method shall perform the Content-Type check at the API layer and reject the promise if the response is not a valid PDF, so the validation lives in one place rather than being duplicated.
5. The error message shown to the candidate for an invalid Content-Type shall be "Arquivo de currículo inválido. Tente gerar novamente.".
