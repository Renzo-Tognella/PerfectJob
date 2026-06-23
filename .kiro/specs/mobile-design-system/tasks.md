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

- [ ] 1. Radius + Shadows + LineHeight Tokens
- [ ] 1.1 Add `radius.ts` token family (P)
  - Create `src/design-system/tokens/radius.ts` exporting `radius` object with keys: `xs: 2`, `sm: 6`, `md: 8`, `lg: 12`, `xl: 14`, `xxl: 16`, `pill: 9999`, `avatar: 48`
  - **Done**: `import { radius } from '@/design-system/tokens/radius'` compiles; values match the design table
  - _Requirements: 1.1, 1.2, 1.5, 1.6_
  - _Boundary: Tokens layer_
- [ ] 1.2 Add `shadows.ts` token family (P)
  - Create `src/design-system/tokens/shadows.ts` exporting `shadows` object with three keys: `card`, `sheet`, `fab`
  - Each shadow uses existing color values: `colors.neutral[900]` or `colors.primary[500]` for shadowColor; opacities from existing recipes (0.06 / 0.15 / 0.3)
  - **Done**: `import { shadows } from '@/design-system/tokens/shadows'` compiles; 3 distinct elevation levels
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_
  - _Boundary: Tokens layer_
- [ ] 1.3 Extend `typography.ts` with `lineHeight` (P)
  - Add `lineHeight` sub-object to the existing `typography` export: `{ tight: 20, normal: 24, relaxed: 28, loose: 32, display: 40 }`
  - **Done**: `import { typography } from '@/design-system/tokens/typography'; typography.lineHeight.normal === 24` compiles
  - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - _Boundary: Tokens layer_

- [ ] 2. Tokens Barrel (`tokens/index.ts`)
- [ ] 2.1 Create `src/design-system/tokens/index.ts` and migrate 5 representative imports (P)
  - Create barrel re-exporting `colors`, `spacing`, `typography`, `radius`, `shadows`
  - Migrate imports in 5 reference files: `JobDetailScreen.tsx`, `ResumesScreen.tsx`, `LoginScreen.tsx`, `EmptyState` (when created in Wave 3), `Card` (when created in Wave 3) — replace deep paths with `'@/design-system/tokens'`
  - **Done**: 5 files now import from barrel; tsc passes; deep paths still work for any files not yet migrated
  - _Requirements: 1.3, 1.4, 2.5_
  - _Boundary: Tokens layer_
  - _Depends: 1.1, 1.2, 1.3_

- [ ] 3. Card Component
- [ ] 3.1 Create `src/design-system/components/Card.tsx` with 3 variants
  - Props: `variant: 'elevated' | 'outlined' | 'flat'` (default `'elevated'`), `children`, `style?: StyleProp<ViewStyle>`
  - All variants: `radius.lg`, `padding[5]`, `paddingVertical: spacing[4]` (or equivalent)
  - `elevated`: `colors.white` bg + `shadows.card`; `outlined`: `colors.white` bg + 1px `colors.neutral[200]` border + no shadow; `flat`: `colors.neutral[50]` bg + no shadow
  - **Done**: snapshot test renders 3 variants with correct styles; visual output matches existing inline styles
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  - _Boundary: Components layer_
- [ ] 3.2 Migrate 6 reference screens to `<Card>` (P)
  - `ResumesScreen.tsx`: replace inline card `View` with `<Card variant="elevated">`; padding stays `padding[5]`; verify visually identical
  - `SavedJobsScreen.tsx`: same migration
  - `JobList.tsx`: same migration
  - `JobDetailScreen.tsx`: replace 2 inline cards (job header + section cards) with `<Card variant="outlined">` or `flat` as appropriate
  - `EditProfileScreen.tsx`: replace item card with `<Card variant="elevated">`; padding stays `padding[3]` (already smaller, this is documented exception)
  - `ProfileScreen.tsx`: replace stat row + item card with `<Card>` variants
  - **Done**: all 6 screens render visually identical cards; zero hardcoded `borderRadius` values remain in the card containers
  - _Requirements: 4.9_
  - _Boundary: Screens_
  - _Depends: 3.1_

- [ ] 4. Chip Component
- [ ] 4.1 Create `src/design-system/components/Chip.tsx` with 3 sizes
  - Props: `size: 'sm' | 'md' | 'lg'` (default `'md'`), `label: string`, `icon?: ReactNode`, `style?`, `textStyle?`
  - `sm`: `padding[1]` v × `padding[3]` h, `typography.fontSize.bodySm`, `radius.pill`, `colors.primary[50]` bg
  - `md`: `padding[2]` v × `padding[3]` h, `typography.fontSize.body`, `radius.pill`, `colors.primary[50]` bg
  - `lg`: `padding[2]` v × `padding[4]` h, `typography.fontSize.body`, `radius.pill`, `colors.primary[50]` bg
  - Text color: `colors.primary[600]` or `colors.neutral[800]` (matching current chip recipes)
  - **Done**: snapshot test renders 3 sizes with correct padding/font/radius
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  - _Boundary: Components layer_
  - _Depends: 1.1_
- [ ] 4.2 Migrate 6 reference chip usages to `<Chip>` (P)
  - `JobCard.tsx`: replace inline badge at line 170 with `<Chip size="sm" label={...} />`
  - `JobDetailScreen.tsx`: replace skill chip (line 318) with `<Chip size="sm" label={...} />`
  - `JobDetailScreen.tsx`: replace level chip (line 347) with `<Chip size="sm" label={...} />`
  - `EditProfileScreen.tsx`: replace level chip (line 302) with `<Chip size="sm">`
  - `ProfileScreen.tsx`: replace skill chip (line 270) with `<Chip size="md">`
  - `HomeScreen.tsx`: replace category chip (line 179) with `<Chip size="lg">`
  - **Done**: all 6 chips render visually identical to before; no inline `borderRadius: 9999` remains
  - _Requirements: 5.8_
  - _Boundary: Screens_
  - _Depends: 4.1_

- [ ] 5. EmptyState Component
- [ ] 5.1 Create `src/design-system/components/EmptyState.tsx`
  - Props: `icon: ReactNode`, `title: string`, `description?: string`, `action?: { label: string, onPress: () => void }`
  - Render: centered column with icon at top (48px), title `h4 semibold`, optional description `bodySm neutral[600]`, optional action button
  - Outer container: `paddingHorizontal: spacing[8]`, icon `marginBottom: spacing[4]`
  - **Done**: snapshot test matches the copy-pasted block from ResumesScreen/SavedJobsScreen/JobList
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_
  - _Boundary: Components layer_
- [ ] 5.2 Migrate 3 empty-state blocks to `<EmptyState>` (P)
  - `ResumesScreen.tsx` lines 210-225: replace inline block with `<EmptyState icon={...} title="Nenhum currículo gerado" description="..." action={{...}} />`
  - `SavedJobsScreen.tsx` lines 181-195: same
  - `JobList.tsx` lines 95-117: same
  - **Done**: 3 copy-pasted blocks deleted; visual output identical
  - _Requirements: 6.5_
  - _Boundary: Screens_
  - _Depends: 5.1_

- [ ] 6. IconButton + StickyBottomBar
- [ ] 6.1 Create `src/design-system/components/IconButton.tsx` (P)
  - Props: `icon: ReactNode | IconProps`, `onPress`, `accessibilityLabel: string`, `variant?: 'neutral' | 'transparent'` (default `'neutral'`)
  - `neutral`: 40×40 circle, `colors.neutral[100]` bg, icon `colors.neutral[800]`
  - `transparent`: 40×40 circle, no bg, icon `colors.neutral[800]`
  - `hitSlop: 8` on all sides by default
  - **Done**: snapshot test for both variants
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - _Boundary: Components layer_
- [ ] 6.2 Create `src/design-system/components/StickyBottomBar.tsx` (P)
  - Props: `children: ReactNode`, `style?: StyleProp<ViewStyle>`
  - Renders bottom-anchored `View` with documented padding, top border, safe-area-aware bottom inset via `useSafeAreaInsets()`
  - **Done**: snapshot test; component exports correctly
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6_
  - _Boundary: Components layer_
  - _Depends: 2.1_
- [ ] 6.3 Migrate reference usages (P)
  - `JobDetailScreen.tsx`: replace back button with `<IconButton icon={{family:'MaterialIcons', name:'arrow-back'}} ... />`; replace sticky bar with `<StickyBottomBar>`
  - `ResumePreviewScreen.tsx`: replace back button with `<IconButton>`
  - `HomeScreen.tsx`: replace bell icon button with `<IconButton variant="transparent">`
  - **Done**: all 4 sites use the new components; visual output identical
  - _Requirements: 7.6, 8.5_
  - _Boundary: Screens_
  - _Depends: 6.1, 6.2_

- [ ] 7. Header + Screen-Edge Padding Normalization
- [ ] 7.1 Document padding matrix in `structure.md` (P)
  - Append "Mobile Design System" subsection to `.kiro/steering/structure.md`
  - Document the 2 header recipes (detail vs list) with file:line rationale
  - Document the 3 screen-edge horizontal values (16 / 20 / 24) with which-to-use-when
  - Document the radius + shadows token families and their intended use
  - Document the font-size + lineHeight pairing convention
  - **Done**: section exists in structure.md; future work can cite it
  - _Requirements: 9.1, 10.1_
  - _Boundary: Steering_
- [ ] 7.2 Migrate screen-edge horizontal padding (P)
  - `JobDetailScreen.tsx`: `scrollContent` `paddingHorizontal: spacing[5]` → `spacing[4]`
  - `ProfileScreen.tsx`: same migration
  - `EditProfileScreen.tsx`: same migration
  - `LoginScreen.tsx`: keep `spacing[6]` (documented auth exception)
  - `RegisterScreen.tsx`: keep `spacing[6]`
  - **Done**: every screen's `paddingHorizontal` is one of the 3 documented values
  - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6_
  - _Boundary: Screens_
  - _Depends: 7.1_
- [ ] 7.3 Migrate header padding to documented recipes (P)
  - `JobDetailScreen.tsx`: confirm header matches "Detail header" recipe (`spacing[4]/spacing[2]/spacing[2]` with border)
  - `ResumePreviewScreen.tsx`: same
  - `ResumesScreen.tsx`: confirm "List header" recipe (`spacing[5]/spacing[5]/spacing[3]`)
  - `SavedJobsScreen.tsx`: same
  - `HomeScreen.tsx`: reclassify (match Detail or document exception in structure.md)
  - **Done**: all 5 headers match a documented recipe
  - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6_
  - _Boundary: Screens_
  - _Depends: 7.1_

- [ ] 8. Final Cleanup
- [ ] 8.1 Replace `spacing[1] / 2` arithmetic in JobCard (P)
  - `JobCard.tsx:217,230`: legacy skill tags replaced with `<Chip size="sm">` (per Requirement 11)
  - Search the codebase for any other token arithmetic; replace with proper tokens
  - **Done**: `rg "spacing\[.+\] / " perfectjob-mobile/src` returns no results
  - _Requirements: 11.1, 11.2, 11.3_
  - _Boundary: Screens_
  - _Depends: 4.2_
- [ ] 8.2 Replace hardcoded fontSize values with tokens (P)
  - `HeroSection.tsx:60` `fontSize: 32` → `typography.fontSize.h2`
  - `LoginScreen.tsx:159` `fontSize: 40` → `typography.fontSize.h1`
  - `RegisterScreen.tsx:188` `fontSize: 40` → `typography.fontSize.h1`
  - `Input.tsx:46` `fontSize: 16` → `typography.fontSize.body`
  - **Done**: `rg "fontSize: [0-9]" perfectjob-mobile/src` returns only matches in `typography.ts`
  - _Requirements: 12.1, 12.2, 12.3_
  - _Boundary: Screens_
  - _Depends: 1.3_
- [ ] 8.3 Resolve `Button.tsx` orphan — wire up or delete
  - Evaluate `Button.tsx` props against `JobDetailScreen.tsx` "Gerar Currículo", `LoginScreen.tsx` "Entrar", `RegisterScreen.tsx` "Criar conta"
  - If adoption is feasible (props match): migrate the 3 reference screens to `<Button>` and document in structure.md
  - If adoption is NOT feasible: delete `Button.tsx` and add a structure.md note that no shared button exists yet
  - **Done**: `Button.tsx` either has ≥3 importers OR does not exist
  - _Requirements: 13.1, 13.2, 13.3, 13.4_
  - _Boundary: Components_
- [ ] 8.4 Final sweep — confirm zero hardcoded values remain
  - `rg "borderRadius: [0-9]" perfectjob-mobile/src` — only matches in `tokens/radius.ts`
  - `rg "fontSize: [0-9]" perfectjob-mobile/src` — only matches in `tokens/typography.ts`
  - `rg "padding[A-Za-z]*: [0-9]+(,|$)" perfectjob-mobile/src --type tsx` — only matches in `tokens/spacing.ts`
  - `rg "spacing\[" perfectjob-mobile/src` — every match is a valid `spacing[N]` reference, no arithmetic
  - **Done**: all 4 grep returns show token files only
  - _Requirements: 1, 2, 11, 12_
  - _Boundary: All_
  - _Depends: 8.1, 8.2, 8.3_

## Requirement Coverage Summary

| Requirement | Tasks |
|-------------|-------|
| 1.1–1.6 (Radius tokens) | 1.1 |
| 2.1–2.6 (Shadows tokens) | 1.2 |
| 3.1–3.5 (LineHeight tokens) | 1.3 |
| 4.1–4.9 (Card component) | 3.1, 3.2 |
| 5.1–5.9 (Chip component) | 4.1, 4.2 |
| 6.1–6.6 (EmptyState component) | 5.1, 5.2 |
| 7.1–7.6 (IconButton component) | 6.1, 6.3 |
| 8.1–8.7 (StickyBottomBar) | 6.2, 6.3 |
| 9.1–9.6 (Header padding) | 7.1, 7.3 |
| 10.1–10.6 (Screen-edge padding) | 7.1, 7.2 |
| 11.1–11.3 (Spacing arithmetic fix) | 4.2, 8.1 |
| 12.1–12.3 (Font size tokenization) | 8.2 |
| 13.1–13.4 (Button resolution) | 8.3 |

## Parallel Execution Waves

| Wave | Tasks | Rationale |
|------|-------|-----------|
| 1 | 1.1, 1.2, 1.3 | Token families are independent foundations |
| 2 | 2.1 | Barrel depends on all 3 token files (Wave 1) |
| 3 | 3.1, 4.1, 5.1, 6.1, 6.2 | Components depend on tokens; independent of each other |
| 4 | 3.2, 4.2, 5.2, 6.3 | Each migration is one file; can run in parallel |
| 5 | 7.1 | Document the matrix before the migrations reference it |
| 6 | 7.2, 7.3 | Padding migrations are per-file; can run in parallel |
| 7 | 8.1, 8.2, 8.3 | Final cleanup; can run in parallel |
| 8 | 8.4 | Verification sweep; depends on all prior waves |
