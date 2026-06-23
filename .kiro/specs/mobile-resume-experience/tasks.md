# Implementation Plan

## Task Format Template

Use whichever pattern fits the work breakdown:

### Major + Sub-task structure
- [ ] {{MAJOR_NUMBER}}. {{MAJOR_TASK_SUMMARY}}
- [ ] {{MAJOR_NUMBER}}.{{SUB_NUMBER}} {{SUB_TASK_DESCRIPTION}}{{SUB_PARALLEL_MARK}}
  - {{DETAIL_ITEM_1}}
  - {{DETAIL_ITEM_2}}
  - {{OBSERVABLE_COMPLETION_ITEM}}
  - _Requirements: {{REQUIREMENT_IDS}}_
  - _Boundary: {{COMPONENT_NAMES}}_
  - _Depends: {{TASK_IDS}}_

> **Parallel marker**: Append ` (P)` only to tasks that can be executed in parallel.

## Tasks

- [x] 1. Resume Types and Job Type Extensions
- [x] 1.1 Create `src/types/resume.ts` with API mirror types (P)
  - Define `GenerateResumeRequest` interface: `{ jobId: number }`
  - Define `ResumeResponse` interface: `{ id, jobId, jobTitle, pdfStoragePath, createdAt, updatedAt }` (all `string` for dates, `number` for ids)
  - Define `ResumeDetailResponse` interface: `{ id, jobId, jobTitle, jobDescription, pdfStoragePath, latexSource, createdAt, updatedAt }`
  - These types MUST match the Java records in `ai-resume-generator/design.md` exactly (field names, types, ordering)
  - **Done**: `import type { ResumeResponse } from '@/types/resume'` compiles; fields align 1:1 with the upstream `ResumeResponse(Long, Long, String, String, LocalDateTime, LocalDateTime)`
  - _Requirements: 6.1, 6.2, 6.3_
  - _Boundary: Types layer_

- [x] 1.2 Add `externalUrl` to Job types
  - Add `externalUrl?: string | null;` as the final field of `JobResponse` in `src/types/job.ts`
  - Add `externalUrl?: string | null;` to the `Job` interface in `src/types/index.ts`
  - **Done**: `JobResponse` and `Job` types both include `externalUrl`; TypeScript compiles with no errors
  - _Requirements: 6.9, 5.1, 5.2_
  - _Boundary: Types layer_
  - _Depends: 1.1, job-external-url Task 3.2 (backend JobResponse.externalUrl must exist for meaningful testing)_

- [x] 2. Resume API Service and Mapper Additions
- [x] 2.1 Create `src/services/api/resumeApi.ts`
  - Implement `list(page, size)`: `GET /v1/resumes?page=${page}&size=${size}` → `PageResponse<ResumeResponse>`
  - Implement `generate(data)`: `POST /v1/resumes` with body `{ jobId }` → `ResumeResponse` — **critical**: use per-request timeout `apiClient.post(url, data, { timeout: 120000 })` (default 10s is too short for generation)
  - Implement `getDetail(id)`: `GET /v1/resumes/${id}` → `ResumeDetailResponse`
  - Implement `getPdfUri(id)`: use `FileSystem.downloadAsync()` from `expo-file-system` with JWT Bearer header from `expo-secure-store`, download to `FileSystem.documentDirectory + 'resume-${id}.pdf'`, return local file URI string
  - Implement `delete(id)`: `DELETE /v1/resumes/${id}` → void
  - Import `apiClient` from `./client`, types from `@/types/resume`, `PageResponse` from `@/types/page`
  - For `getPdfUri`: construct full URL from `ENV.API_URL`, read token via `await SecureStore.getItemAsync('auth_token')`
  - **Done**: All 5 methods are callable; `generate` uses 120s timeout; `getPdfUri` returns a local file URI after download
  - _Requirements: 6.4, 3.7_
  - _Boundary: Service layer_
  - _Depends: 1.1_

- [x] 2.2 Add `toResume` mapper and `externalUrl` pass-through to `mappers.ts`
  - Add `ResumeView` interface to `src/services/api/mappers.ts`: `{ id, jobId, jobTitle, createdAt, createdAtLabel }`
  - Add `toResume(response: ResumeResponse): ResumeView` function that formats `createdAt` to pt-BR date via `toLocaleDateString('pt-BR')`
  - Add `externalUrl: response.externalUrl ?? null` to the return object of `toJob()`
  - Do NOT remove application mappers yet (that happens in Task 10)
  - **Done**: `toResume(baseResumeResponse)` returns a `ResumeView` with formatted date; `toJob(response).externalUrl` reflects the API value
  - _Requirements: 6.9, 2.2_
  - _Boundary: Service layer_
  - _Depends: 1.1, 1.2_

- [x] 3. Add `expo-file-system` Dependency (P)
  - Add `"expo-file-system": "~18.0.0"` to `dependencies` in `perfectjob-mobile/package.json`
  - Run `npm install` in `perfectjob-mobile/`
  - Verify the import `import * as FileSystem from 'expo-file-system'` resolves in the Expo Go runtime
  - **Done**: `expo-file-system` is in `package.json` and `node_modules`; app starts without errors in Expo Go
  - _Requirements: 4.7_
  - _Boundary: Build config / dependencies_

- [x] 4. Resume TanStack Query Hooks (P)
- [x] 4.1 Create `src/hooks/useResumes.ts`
  - Implement `useResumes()`: `useInfiniteQuery` with key `['resumes', 'list']`, calls `resumeApi.list(pageParam)`, `getNextPageParam` from `PageResponse.number < totalPages - 1`, `initialPageParam: 0` — follows `useMyApplications` pattern exactly
  - Implement `useGenerateResume()`: `useMutation` calling `resumeApi.generate(req)`, `onSuccess` invalidates `['resumes']` namespace via `queryClient.invalidateQueries({ queryKey: ['resumes'] })`
  - Implement `useResumeDetail(resumeId)`: `useQuery` with key `['resumes', 'detail', resumeId]`, `enabled: !!resumeId`
  - Implement `useDeleteResume()`: `useMutation` calling `resumeApi.delete(id)`, `onSuccess` invalidates `['resumes']` namespace
  - **Done**: All 4 hooks are importable; `useResumes()` returns `{ data, isLoading, isError, refetch, fetchNextPage, hasNextPage }`; `useGenerateResume()` returns `.mutate()` with cache invalidation
  - _Requirements: 6.5, 6.6, 6.7, 6.8_
  - _Boundary: Hook layer_
  - _Depends: 2.1_

- [x] 5. PdfViewer Component (P)
- [x] 5.1 Create `src/components/shared/PdfViewer.tsx`
  - Props: `{ resumeId: number; onError?: (error: unknown) => void }`
  - Internal state: `status: 'idle' | 'downloading' | 'ready' | 'error'`, `localUri: string | null`
  - On mount/resumeId change: call `resumeApi.getPdfUri(resumeId)`, set `downloading` → `ready` (store URI) or `error`
  - When `ready`: render `<WebView source={{ uri: localUri }} style={{ flex: 1 }} />`
  - When `downloading`: render centered `<ActivityIndicator color={colors.primary[500]} />` with "Carregando currículo..." text
  - When `error`: render error message "Não foi possível carregar o currículo" + "Tentar novamente" button that re-triggers download
  - Import `WebView` from `react-native-webview`, `ActivityIndicator`, `View`, `Text`, `TouchableOpacity` from `react-native`
  - **Done**: `<PdfViewer resumeId={42} />` downloads and displays the PDF in a WebView within Expo Go; loading and error states render correctly
  - _Requirements: 4.2, 4.3, 4.4, 4.6, 4.7_
  - _Boundary: Component layer_
  - _Depends: 2.1, 3_

- [x] 6. ResumesScreen (P)
- [x] 6.1 Create `src/screens/resumes/ResumesScreen.tsx`
  - Mirror the `ApplicationsScreen` structure: `SafeAreaView`, header "Meus Currículos", `FlatList` with infinite scroll
  - Use `useResumes()` hook; map pages via `data?.pages.flatMap(page => page.content.map(toResume))`
  - Card layout: job title (semibold, neutral[900]), "Gerado em {createdAtLabel}" (caption, neutral[400]), "Ver PDF" button (primary[500] bg, white text, rounded)
  - Card tap or "Ver PDF" → `navigation.navigate('ResumePreview', { resumeId: item.id })`
  - Empty state: `Icon` document-text (neutral[300]) + "Nenhum currículo gerado" + "Explore as vagas e gere seu primeiro currículo!"
  - Error state: "Não foi possível carregar" + "Tentar novamente" button calling `refetch()`
  - Loading state: centered `<ActivityIndicator color={colors.primary[500]} />`
  - Pull-to-refresh via `RefreshControl`
  - Infinite scroll via `onEndReached` + `fetchNextPage` with loading footer
  - Use design tokens: `colors`, `typography`, `spacing` — no hardcoded hex values
  - **Done**: Screen renders a paginated list of resume cards; empty/error/loading states display correctly; tapping a card navigates to `ResumePreview`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_
  - _Boundary: Screen layer_
  - _Depends: 4.1, 2.2_

- [x] 7. JobDetailScreen Rework (P)
- [x] 7.1 Rework `src/screens/job-detail/JobDetailScreen.tsx`
  - Replace `import { useSubmitApplication } from '@/hooks/useApplications'` with `import { useGenerateResume } from '@/hooks/useResumes'`
  - Replace `const submitApplication = useSubmitApplication()` with `const generateResume = useGenerateResume()`
  - Rename `handleApply` → `handleGenerate`; remove the `Alert.alert` confirmation (generation is intentional, the loading state is the feedback)
  - In `handleGenerate`: if not authenticated → Alert for login; else `generateResume.mutate({ jobId }, { onSuccess: (resume) => navigation.navigate('ResumePreview', { resumeId: resume.id }), onError: (err) => Alert.alert('Erro', extractErrorMessage(err)) })`
  - Change button text from "Candidatar-se" to "Gerar Currículo"
  - When `generateResume.isPending`: show `<ActivityIndicator color={colors.white} />` + `<Text>Gerando currículo...</Text>` in the button
  - Replace `disabled={submitApplication.isPending}` with `disabled={generateResume.isPending}`; replace `submitApplication.isPending && styles.applyBtnDisabled` with `generateResume.isPending && styles.applyBtnDisabled`
  - Replace hardcoded `'background: '#2B5FC2'` in `applyBtn` style with `colors.primary[500]`
  - Add `import { Linking } from 'react-native'` (add to existing react-native import)
  - Add "Ver vaga original" `TouchableOpacity` after the Habilidades section, rendered only when `job.externalUrl` is truthy: `<Icon family="MaterialIcons" name="open-in-new" size={18} color={colors.primary[500]} />` + `<Text>Ver vaga original</Text>`, onPress → `Linking.openURL(job.externalUrl!)`
  - Change accessibility label from "Candidatar-se a esta vaga" to "Gerar currículo para esta vaga"
  - **Done**: Button reads "Gerar Currículo"; tapping it (when authenticated) triggers generation with 120s timeout and shows "Gerando currículo..."; on success navigates to ResumePreview; "Ver vaga original" link appears only when externalUrl is present
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5.1, 5.2, 5.3, 5.4_
  - _Boundary: Screen layer_
  - _Depends: 4.1, 1.2_

- [x] 8. ResumePreviewScreen
- [x] 8.1 Create `src/screens/resume-preview/ResumePreviewScreen.tsx`
  - Read `resumeId` from route via `useRoute<RouteProp<MainStackParamList, 'ResumePreview'>>()` and `useNavigation()` for back navigation
  - Header: back button (`Icon` arrow-back, neutral[800]) + title "Currículo" (typography.h5)
  - Body: `<PdfViewer resumeId={resumeId} />` filling remaining space
  - Optional "Abrir vaga original" link below the viewer if the resume detail has an associated job with externalUrl (fetch via `useResumeDetail(resumeId)` if link is desired — but since `ResumeDetailResponse` doesn't include externalUrl, this link is only available from JobDetailScreen context; keep ResumePreviewScreen focused on PDF + back)
  - Style with design tokens: `colors`, `typography`, `spacing`
  - **Done**: Screen renders the PdfViewer with the resumeId from route params; "Voltar" button navigates back; loading and error states are handled by PdfViewer internally
  - _Requirements: 4.1, 4.5_
  - _Boundary: Screen layer_
  - _Depends: 5.1_

- [x] 9. Navigation Update
- [x] 9.1 Update `src/navigation/MainNavigator.tsx`
  - In `MainStackParamList`: add `ResumePreview: { resumeId: number }`
  - In `TabParamList`: rename `Applications: undefined` → `Resumes: undefined`
  - In `TAB_ICONS`: rename key `Applications` → `Resumes` (keep `['document-text', 'document-text-outline']`)
  - Replace import `ApplicationsScreen` from `@/screens/applications/ApplicationsScreen` with `ResumesScreen` from `@/screens/resumes/ResumesScreen`
  - Add import `ResumePreviewScreen` from `@/screens/resume-preview/ResumePreviewScreen`
  - In `TabNavigator`: change `<Tab.Screen name="Applications" ...>` to `<Tab.Screen name="Resumes" component={ResumesScreen} options={{ tabBarLabel: 'Currículos' }} />`
  - In `MainNavigator` stack: add `<Stack.Screen name="ResumePreview" component={ResumePreviewScreen} options={{ headerShown: false }} />`
  - **Done**: Bottom tab shows "Currículos" and navigates to ResumesScreen; `navigation.navigate('ResumePreview', { resumeId })` works from JobDetailScreen and ResumesScreen
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1_
  - _Boundary: Navigation layer_
  - _Depends: 6.1, 8.1_

- [x] 10. Application Code Removal
- [x] 10.1 Delete application files and clean mappers
  - Delete `src/types/application.ts`
  - Delete `src/services/api/applicationApi.ts`
  - Delete `src/hooks/useApplications.ts`
  - Delete `src/screens/applications/ApplicationsScreen.tsx` and the `src/screens/applications/` directory
  - In `src/services/api/mappers.ts`: remove the `ApplicationResponse`/`ApplicationStatus` import from `@/types/application`, remove `applicationStatusConfig`, remove `ApplicationView` interface, remove `toApplication()` function
  - **Done**: No file in `src/` imports from `application`, `applicationApi`, `useApplications`, or references `ApplicationView`/`toApplication`/`applicationStatusConfig`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  - _Boundary: Cleanup (cross-cutting)_
  - _Depends: 9.1_

- [x] 10.2 Remove `applicationsCount` from mobile profile types
  - Grep for `applicationsCount` in `perfectjob-mobile/src/` — if found in `ProfileResponse` mirror type or any screen/hook, remove it
  - The `ai-resume-generator` spec removes this field from the backend `ProfileResponse`; the mobile consumer must tolerate its absence
  - **Done**: No reference to `applicationsCount` exists in `perfectjob-mobile/src/`
  - _Requirements: 7.8 (adjacent impact)_
  - _Boundary: Types + UI cleanup_
  - _Depends: 10.1_

- [x] 10.3 Verify clean build and lint
  - Run `npm run lint` in `perfectjob-mobile/` — expect zero errors and zero warnings referencing application code
  - Run TypeScript check (`npx tsc --noEmit`) — expect no errors
  - Grep for any remaining references to `ApplicationsScreen`, `useApplications`, `applicationApi`, `ApplicationResponse`, `SubmitApplicationRequest`, `toApplication`, `ApplicationView`, `applicationStatusConfig` in `src/` — expect zero hits
  - **Done**: Lint passes, TypeScript compiles, grep returns zero application references
  - _Requirements: 7.7, 7.8_
  - _Boundary: Build verification_
  - _Depends: 10.1_

- [x] 11. Tests
- [x] 11.1 Update `src/services/api/__tests__/mappers.test.ts`
  - Add `externalUrl: 'https://example.com/job'` to `baseResponse`
  - Add test: `toJob` includes `externalUrl` when present
  - Add test: `toJob` sets `externalUrl` to null when absent
  - Add a `baseResumeResponse` fixture matching `ResumeResponse`
  - Add test suite for `toResume`: maps fields correctly, formats `createdAt` to pt-BR date label
  - **Done**: `npm test` passes; `toJob` externalUrl tests and `toResume` tests are green
  - _Requirements: 6.9, 5.1, 5.2, 2.2_
  - _Boundary: Testing_
  - _Depends: 2.2, 10.1_

- [x] 11.2* Add resume hook and service tests
  - Add test for `resumeApi.generate` using a 120s timeout (mock axios and assert config.timeout === 120000)
  - Add test for `useResumes` infinite query behavior (mock `resumeApi.list`, assert pagination)
  - Add test for `useGenerateResume` mutation invalidating `['resumes']` on success
  - **Done**: Tests pass and cover the critical timeout and cache invalidation behaviors
  - _Requirements: 3.7, 6.5, 6.6_
  - _Boundary: Testing_
  - _Depends: 4.1_

## Requirement Coverage Summary

| Requirement | Tasks |
|-------------|-------|
| 1.1–1.5 | 9.1 |
| 2.1–2.8 | 6.1 |
| 3.1–3.7 | 7.1 |
| 4.1–4.7 | 5.1, 8.1 |
| 5.1–5.4 | 7.1 |
| 6.1–6.9 | 1.1, 2.1, 2.2, 4.1 |
| 7.1–7.8 | 10.1, 10.2 |
| 8.1–8.7 | 6.1, 7.1, 8.1 |

## Parallel Execution Waves

| Wave | Tasks | Rationale |
|------|-------|-----------|
| 1 | 1.1, 1.2, 3 | Types and dependency are independent foundations |
| 2 | 2.1, 2.2 | Service + mappers depend on types (Wave 1) |
| 3 | 4.1, 5.1 | Hooks and PdfViewer both depend on resumeApi (Wave 2), independent of each other |
| 4 | 6.1, 7.1 | Both screens depend on hooks (Wave 3), independent of each other |
| 5 | 8.1 | ResumePreviewScreen depends on PdfViewer (Wave 3) |
| 6 | 9.1 | Navigation depends on both screens (Waves 4-5) |
| 7 | 10.1, 10.2 | Removal depends on navigation no longer referencing applications |
| 8 | 11.1, 11.2 | Tests depend on all implementation being complete |
