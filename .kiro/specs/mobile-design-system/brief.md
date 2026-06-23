# Brief: mobile-design-system

## Problem

The PerfectJob mobile app (`perfectjob-mobile/`) ships with three design-token files (`spacing`, `typography`, `colors`) but **no enforced design system**. Every screen rolls its own `StyleSheet.create` with hardcoded numbers, leading to pervasive visual inconsistency:

- **54 hardcoded `borderRadius` values** across 13 files — there is no `radius` token family at all
- **5 distinct chip/badge padding recipes** in screens that should look identical (e.g., `JobCard.tsx:170` 4×12 vs `ProfileScreen.tsx:270` 8×12 vs `HomeScreen.tsx:179` 8×16)
- **3 screens copy-paste the same EmptyState block** (`ResumesScreen.tsx:210-225`, `SavedJobsScreen.tsx:181-195`, `JobList.tsx:95-117`) — should be one component
- **Inconsistent list/screen padding** (`spacing[4]` vs `spacing[5]` vs `spacing[6]` for the same conceptual edge depending on the screen)
- **An orphaned `Button.tsx`** in `design-system/components/` that no screen imports
- **Arithmetic on tokens** (`spacing[1] / 2` in `JobCard.tsx:217,230`) — produces values that no token can ever reproduce
- **Hardcoded font sizes** in 4 places (`HeroSection.tsx:60`, `LoginScreen.tsx:159`, `RegisterScreen.tsx:188`, `Input.tsx:46`) that bypass `typography.fontSize.*`
- **No barrel file** — every import is the deep path `import { spacing } from '@/design-system/tokens/spacing'`

The pain is visible: a recruiter or academic reviewer opening the app sees visibly inconsistent spacing, radii, and shadows across screens that should feel like one product. It also blocks future feature work because every new screen requires re-discovering the "right" padding/radius.

## Current State

Phase 1 of the project (job-external-url, ai-resume-generator, mobile-resume-experience) shipped the resume-generation feature. The mobile screens added in Phase 1 (`ResumesScreen`, `ResumePreviewScreen`, the reworked `JobDetailScreen`) have the same design-system debt as the older screens — they did not introduce it, but they did not fix it either.

There is no shared `Card`, `Chip`, `EmptyState`, `IconButton`, or `StickyBottomBar` component. There is no `radius.ts` or `shadows.ts` token file. The existing `Button.tsx` is dead code.

## Desired Outcome

After this spec:

1. Every spacing, padding, margin, gap, radius, shadow, and font-size value in the mobile app is sourced from a design token in `src/design-system/tokens/`.
2. The five most-repeated visual patterns (`Card`, `Chip`, `EmptyState`, `IconButton`, `StickyBottomBar`) exist as shared components under `src/design-system/components/`, each documented with usage examples.
3. Cross-screen padding follows a documented matrix (header padding, list-screen horizontal padding, sticky-bar padding, card padding, chip padding) with one canonical choice per concept and named exceptions where the screen genuinely needs a different value.
4. The orphaned `Button.tsx` is either wired into screens or deleted.
5. Visual diff before/after across the 13 affected screens shows no functional regressions — only consolidation of values into tokens/components.

## Approach

**Vertical-slice refactor**: each task = one token family OR one component, plus a reference-screen migration that proves the token/component works. This keeps every PR reviewable (≤200 line diff per task) and lets work parallelize cleanly.

**Why not token-first or component-first?**
- Token-first leaves screens inconsistent until the very last task.
- Component-first exposes missing tokens mid-task (e.g., a `Card` needs a shadow token that doesn't exist yet).
- Vertical-slice keeps the codebase buildable and visually coherent at every commit.

**Order of tasks** (driven by dependency):
1. Add `radius.ts` (sm 6, md 8, lg 12, xl 14, xxl 16, pill 9999, avatar 48) and migrate the most-used radius (8 → `radius.md`) in `JobDetailScreen.tsx` first.
2. Add `shadows.ts` (3 elevation recipes — `card`, `sheet`, `fab`) and migrate `JobCard.tsx`.
3. Add `tokens/index.ts` barrel; migrate 5 representative imports to deep-free form (`import { spacing, radius, shadows, colors, typography } from '@/design-system/tokens'`).
4. Extract `<Chip>` (sizes: sm/md/lg matching the 3 existing recipes); migrate `JobCard.tsx`, `JobDetailScreen.tsx`, `ProfileScreen.tsx`.
5. Extract `<Card>` (3 variants: elevated/outlined/flat); migrate `ResumesScreen.tsx`, `SavedJobsScreen.tsx`, `JobList.tsx`.
6. Extract `<EmptyState>` (single component); delete the 3 copy-pasted blocks.
7. Extract `<IconButton>` (40×40, `radius.full`); migrate `JobDetailScreen.tsx`, `HomeScreen.tsx`, `ResumePreviewScreen.tsx`.
8. Extract `<StickyBottomBar>` (or document the pattern); migrate `JobDetailScreen.tsx`.
9. Normalize header padding to one canonical recipe (recommend `spacing[4]/spacing[2]/spacing[2]` for detail, `spacing[5]/spacing[5]/spacing[3]` for list, documented in steering); migrate all 5 affected screens.
10. Normalize screen-edge horizontal padding (recommend `spacing[4]` everywhere except auth screens); migrate `JobDetailScreen.tsx`, `ProfileScreen.tsx`.
11. Replace the `spacing[1] / 2` arithmetic in `JobCard.tsx:217,230` (introduce `radius.xs = 2` or remove the badges entirely).
12. Replace hardcoded font sizes (`32`, `40`, `16`) with `typography.fontSize.*`; add `typography.lineHeight` family if needed.
13. Wire up or delete the orphaned `Button.tsx` (recommend wire-up via 3 reference uses, then delete duplicates).

## Scope

- **In**:
  - New files in `src/design-system/tokens/` (`radius.ts`, `shadows.ts`, `index.ts`)
  - New files in `src/design-system/components/` (`Card.tsx`, `Chip.tsx`, `EmptyState.tsx`, `IconButton.tsx`, `StickyBottomBar.tsx`)
  - Refactor of all 13 mobile screen files to consume the new tokens/components
  - Migration of the orphaned `Button.tsx` (wire-up or removal)
  - Documentation of the spacing/padding matrix in `.kiro/steering/structure.md` (append a "Mobile Design System" subsection)
  - Storybook-style usage examples in each new component file (a JSDoc comment block at the top is sufficient — no Storybook runtime needed)
- **Out**:
  - Dark mode / theming (academic scope; product copy is pt-BR single-language)
  - Animations / motion tokens (no animation library currently in use)
  - Icon library changes (already on `@expo/vector-icons`)
  - Re-design of any screen's visual hierarchy (this is consolidation, not redesign)
  - Backend, API, or admin-web changes (mobile-only)
  - Adding new screens or features
  - TypeScript strict-mode migration (orthogonal concern)
  - Accessibility audit (separate spec)

## Boundary Candidates

The natural responsibility seams for future sub-specs if this grows:
- **Token catalog maintenance** (adding new sizes, semantic tokens)
- **Component library expansion** (Modal, Toast, Avatar — not needed now)
- **Theme/dark-mode** (orthogonal future work)
- **Design QA automation** (visual regression testing — separate spec)

None of these are needed today; this spec stays focused on consolidation.

## Out of Boundary

- This spec does **not** redesign any screen's visual hierarchy. If a screen currently uses `padding: spacing[10]` and the canonical choice would be `spacing[8]`, this spec keeps `spacing[10]` if it is intentional (a "long form" exception), and only standardizes the **undocumented** inconsistencies.
- This spec does **not** add new visual primitives beyond the 5 listed. Adding a `Modal`, `Toast`, or `Avatar` is a separate spec.
- This spec does **not** touch the admin web app's design system — admin has its own token set; cross-app unification is out of scope.

## Upstream / Downstream

- **Upstream**: `mobile-resume-experience` (Phase 1) — the new screens shipped there use the existing inconsistent patterns. This spec consumes those screens as migration targets.
- **Downstream**:
  - Future mobile feature work will inherit the consolidated design system, so new screens don't recreate the debt.
  - The `mobile-resume-experience` extension (Phase 2 / concern B — ENV.API_URL fix, status polling) runs in parallel and does not need this spec to land first; it changes logic, not visuals.
  - Visual regression testing (future spec) depends on a stable design system to detect real regressions.

## Existing Spec Touchpoints

- **Extends**: none. This is a refactor, not a feature extension.
- **Adjacent**:
  - `mobile-resume-experience` (Phase 1) — the screens it ships (`ResumesScreen`, `ResumePreviewScreen`, reworked `JobDetailScreen`) are the highest-traffic migration targets in this spec. Coordinate so this spec does not start migrating those screens until the user has signed off on the design-system token choices.
  - `mobile-resume-experience` (Phase 2 / concern B extension) — runs in parallel; touch different files (`resumeApi.ts`, `useResumes.ts`, `PdfViewer.tsx` internal error handling). No conflict.

## Constraints

- **Expo Go runtime** — must not require native modules or dev-client builds. All new components use only `View`, `Text`, `Pressable`, `StyleSheet` from `react-native` + tokens.
- **TypeScript strict mode** — new component files must be fully typed (props interface exported; `StyleProp<ViewStyle>` for `style` overrides).
- **No new dependencies** — pure token/component extraction from existing dependencies.
- **Backward compatibility** — existing screen visuals must not change perceptibly. The migration is consolidation, not redesign. If a visual change is unavoidable, document it in the PR.
- **Test coverage** — every new component must have a snapshot test in `src/design-system/components/__tests__/`. Existing 19 mobile tests must continue to pass.
- **Import alias** — `@/` → `src/` (per `.kiro/steering/structure.md`). New components must be importable as `@/design-system/components/Card`.
- **Product copy** — Portuguese (pt-BR) for any user-visible label; English for code/comments/types.
- **File size** — each new component file ≤ 150 lines (extraction discipline).
