# Brief: mobile-resume-experience

## Problem

The mobile app's candidate flow is built around "submit application" — a Candidaturas tab listing applications, and a "Candidatar-se" button on the job detail screen. With the pivot to AI resume generation, the entire candidate flow needs to change: the tab becomes "Currículos", the button becomes "Gerar Currículo", and a new PDF preview screen is needed.

## Current State

- **Navigation** (`src/navigation/MainNavigator.tsx`):
  - `TabParamList`: `Home, Search, Saved, Applications, Profile` (PT labels: Início, Buscar, Salvas, **Candidaturas**, Perfil)
  - `MainStackParamList`: `Tabs, JobDetail{slug}, EditProfile`
- **ApplicationsScreen** (`src/screens/applications/ApplicationsScreen.tsx`): FlatList of `ApplicationView` cards (jobTitle, company, status badge, "Candidatado em {date}"). Header "Minhas Candidaturas". Empty state "Nenhuma candidatura".
- **JobDetailScreen** (`src/screens/job-detail/JobDetailScreen.tsx`, 360 lines): sticky bottom "Candidatar-se" button → `handleApply()` → confirm Alert → `submitApplication.mutate({jobId})`. Save/bookmark toggle in header.
- **Services/hooks**: `services/api/` has application-related API calls. `hooks/` has TanStack Query mutations/queries for applications.
- **Types**: `types/` has Application-related TypeScript types.
- **No PDF viewer dependency**: No `react-native-pdf`, no PDF preview capability exists.

## Desired Outcome

- Bottom tab renamed: "Candidaturas" → "Currículos" (icon stays `document-text` or similar).
- Tab screen shows generated resumes (not applications): each card shows job title, company, generation date, and a "Ver PDF" button.
- JobDetailScreen bottom button: "Candidatar-se" → "Gerar Currículo" (triggers generation via POST `/v1/resumes`).
- After generation, navigate to a new **PDF preview screen** showing the generated resume.
- PDF preview screen: renders the PDF with a "Abrir vaga original" link (if job has external URL) and a "Voltar" button.
- JobDetailScreen shows "Ver vaga original" link if `job.externalUrl` is present.
- All application-related code (types, services, hooks, screens) is removed or replaced.

## Approach

1. **Types**: Replace `Application` type with `Resume` type matching the API response. Add `externalUrl` to `Job` type.
2. **Services**: Replace application API service with resume API service (`POST /v1/resumes`, `GET /v1/resumes`, `GET /v1/resumes/{id}/pdf`).
3. **Hooks**: Replace `useApplications` with `useResumes` (TanStack Query). Add `useGenerateResume` mutation. Add `useResumePdf` hook for PDF fetching.
4. **Screens**:
   - Rename `applications/` → `resumes/`. Rewrite `ResumesScreen` to list resumes.
   - Rework `JobDetailScreen`: change button, add generation mutation, add "Ver vaga original" link.
   - Add `resume-preview/ResumePreviewScreen`: fetches PDF, renders via `react-native-pdf` or expo file system + webview.
5. **Navigation**: Update `TabParamList` (rename `Applications` → `Resumes`), update tab label. Add `ResumePreview{resumeId}` to `MainStackParamList`.
6. **PDF rendering**: Use `react-native-pdf` (most mature) or download to file system + open in webview. Evaluate based on Expo SDK 54 compatibility.

## Scope

- **In**:
  - Rename Candidaturas tab → Currículos (navigation config, tab label)
  - Replace ApplicationsScreen with ResumesScreen (list of generated resumes)
  - Change JobDetailScreen button: Candidatar-se → Gerar Currículo
  - Add ResumePreviewScreen with PDF rendering
  - Add "Ver vaga original" link on JobDetailScreen (if `externalUrl` exists)
  - Replace application types, services, hooks with resume equivalents
  - Add PDF viewer dependency (react-native-pdf or equivalent)
  - Update navigation types and route params
- **Out**:
  - Resume editing (regenerate instead)
  - Offline resume caching (beyond TanStack Query's default cache)
  - Push notifications for generation completion (synchronous generation)
  - Share/forward resume PDF (future)
  - Admin panel changes (out of scope — admin loses application tracking)

## Boundary Candidates

- **API contract seam**: The mobile app only interacts with the backend via `/v1/resumes` endpoints. No knowledge of LaTeX, LLM, or tectonic.
- **Screen-level boundaries**: ResumesScreen (list), JobDetailScreen (generation trigger), ResumePreviewScreen (PDF viewing) are independent components.
- **PDF rendering seam**: Behind a component (`PdfViewer`) so the rendering library can be swapped without affecting screens.

## Out of Boundary

- Resume generation backend (Spec: ai-resume-generator)
- Job external URL plumbing (Spec: job-external-url — mobile display of the link is included here as it's a UI concern)
- Profile UI changes
- Admin web changes

## Upstream / Downstream

- **Upstream**: 
  - `ai-resume-generator` spec (provides `/v1/resumes` API — this spec consumes it)
  - `job-external-url` spec (provides `externalUrl` in JobResponse — this spec displays it)
- **Downstream**: none (mobile is the end consumer)

## Existing Spec Touchpoints

- **Extends**: none
- **Adjacent**: 
  - `job-external-url` (mobile types for `Job.externalUrl` overlap — coordinate)
  - `ai-resume-generator` (Resume type definition must match API response shape)

## Constraints

- **Expo SDK 54 / RN 0.81.5**: PDF rendering library must be compatible. `react-native-pdf` requires native module — may need Expo dev client (not Expo Go). Evaluate `expo-file-system` + `<WebView>` as a fallback that works in Expo Go.
- **Offline mode**: Expo runs `--offline` (avoids tunnel 500 errors). PDF library must work without Expo's online services.
- **API_URL from env**: Mobile reads `API_URL` from `expo-constants` / `.env`. Never hardcode `localhost`.
- **PT-BR copy**: All UI text in Portuguese. "Currículos", "Gerar Currículo", "Ver PDF", "Ver vaga original", "Nenhum currículo gerado".
- **TanStack Query patterns**: Follow existing patterns (query keys, mutation hooks, loading/error states) used in current hooks.
- **Design tokens**: Primary `#2B5FC2`, Accent `#FF6B35`, Success `#16A34A`. Use design-system tokens, not hardcoded hex.
- **Synchronous generation**: The "Gerar Currículo" button shows a loading state until the PDF is ready. May take 10-30 seconds (LLM + LaTeX compilation). Show appropriate UX (spinner, "Gerando currículo..." text).
