# Requirements Document

## Introduction

The PerfectJob mobile app (`perfectjob-mobile/`) ships with three design-token files (`spacing`, `typography`, `colors`) but no enforced design system. Every screen rolls its own `StyleSheet.create` with hardcoded numbers, leading to pervasive visual inconsistency: 54 hardcoded `borderRadius` values, 5 distinct chip-padding recipes, 3 copy-pasted empty-state blocks, an orphaned `Button` component, and arithmetic on tokens. This spec establishes the missing tokens (radius, shadows, lineHeight), extracts the most-repeated visual patterns into shared components (Card, Chip, EmptyState, IconButton, StickyBottomBar), and documents a padding matrix so every screen reaches for the same value for the same concept. The work is consolidation, not redesign — existing screen visuals must not change perceptibly. All UI text is in Portuguese (pt-BR); code and tokens are in English.

## Boundary Context

- **In scope**:
  - Add `radius.ts`, `shadows.ts`, and `tokens/index.ts` barrel files in `src/design-system/tokens/`
  - Add `radius`, `shadows`, and `lineHeight` token families, plus the `tokens/index.ts` barrel that re-exports them
  - Extract five shared components under `src/design-system/components/`: `Card`, `Chip`, `EmptyState`, `IconButton`, `StickyBottomBar`
  - Migrate the 13 mobile screen files and the 3 widget files that currently consume hardcoded values to use the new tokens and components
  - Document the padding matrix (header, list horizontal, list bottom, card, chip, sticky-bar) in a new subsection of `.kiro/steering/structure.md`
  - Wire the orphaned `Button.tsx` into reference screens OR delete it if no clean fit is found
- **Out of scope**:
  - Dark mode / theming (academic scope; product is pt-BR single-language)
  - Animations / motion tokens (no animation library currently in use)
  - Re-designing any screen's visual hierarchy (consolidation, not redesign)
  - Admin web app tokens (admin has its own token set)
  - TypeScript strict-mode migration (orthogonal concern)
  - Accessibility audit (separate future spec)
  - Storybook runtime (JSDoc usage examples only)
  - Adding new visual primitives beyond the 5 listed (Modal, Toast, Avatar = future specs)
- **Adjacent expectations**:
  - The `mobile-resume-experience` Phase 2 (health check banner, sticky bottom-bar in JobDetailScreen) consumes the `StickyBottomBar` component once extracted — coordinate the component API so it can absorb the existing JobDetailScreen sticky bar without losing current visuals
  - The orphaned `Button.tsx` is referenced by NO screen today; if it cannot be cleanly adopted in 3+ reference screens during migration, it shall be deleted rather than left as dead code
  - This spec touches 13+ files and 100+ token references; the implementation order MUST be token-first (radius + shadows) before component extraction, so component migrations land on a stable token foundation

## Requirements

### Requirement 1: Radius Design Tokens

**Objective:** As a mobile developer, I want a single `radius` token family with named values, so that every border-radius in the app is sourced from a documented choice rather than a magic number.

#### Acceptance Criteria

1. The mobile app shall define a `radius` token object exported from `src/design-system/tokens/radius.ts`.
2. The token object shall include at minimum the following keys with their numeric values (in points): `xs: 2`, `sm: 6`, `md: 8`, `lg: 12`, `xl: 14`, `xxl: 16`, `pill: 9999`, `avatar: 48`.
3. The `tokens/index.ts` barrel shall re-export `radius` alongside the existing `spacing`, `typography`, and `colors` exports.
4. Every screen, component, or hook that imports `spacing` (or any other token) shall be able to import `radius` from the same `@/design-system/tokens` barrel with no path changes.
5. The `radius` token family shall not introduce any value already absent from the existing app — every numeric value in the family shall be defensible from at least one current usage in the codebase.
6. The `radius.avatar` value of 48 shall be chosen because it equals half of the standard 96px avatar dimension; if avatars of different sizes are introduced in the future, the token family shall be extended rather than the existing keys redefined.

### Requirement 2: Shadow Design Tokens

**Objective:** As a mobile developer, I want a `shadows` token family with three elevation recipes, so that every shadow/elevation value in the app is sourced from a documented choice rather than a hardcoded `{shadowOpacity, shadowRadius, elevation}` tuple duplicated across files.

#### Acceptance Criteria

1. The mobile app shall define a `shadows` token object exported from `src/design-system/tokens/shadows.ts`.
2. The token object shall include at minimum three keys: `card` (used for resting cards), `sheet` (used for floating sheets/modals), `fab` (used for floating action buttons).
3. Each shadow token shall include `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, and `elevation` properties as expected by React Native's `View` style prop on iOS and Android respectively.
4. The three shadow recipes shall be chosen from values that already exist in the current codebase, consolidated into three coherent elevations rather than introducing new visual styles.
5. The `tokens/index.ts` barrel shall re-export `shadows`.
6. The `shadows` token family shall not introduce any color or opacity value that differs from the existing app's `colors.neutral` and `colors.primary` palettes.

### Requirement 3: LineHeight Token Family

**Objective:** As a mobile developer, I want a `lineHeight` token family with named values that pair with the existing `fontSize` tokens, so that line-height is no longer a magic number when a text style is composed.

#### Acceptance Criteria

1. The mobile app shall define a `lineHeight` token object exported from `src/design-system/tokens/typography.ts` (or a new `lineHeights.ts` co-located with `typography.ts`).
2. The token object shall include at minimum the following keys with numeric values: `tight: 20`, `normal: 24`, `relaxed: 28`, `loose: 32`, `display: 40`.
3. The values shall be defensible from current usage: `tight` for small captions and badges, `normal` for body text, `relaxed` for headings, `loose` for h2, `display` for h1/hero text.
4. The `typography` token object shall expose a `lineHeight` sub-object (or import from the new file) so that consumers can write `typography.lineHeight.normal` without a separate import.
5. The existing `HeroSection.tsx:63` hardcoded `lineHeight: 40` shall be replaced with `typography.lineHeight.display` after this requirement is implemented.

### Requirement 4: Card Shared Component

**Objective:** As a mobile developer, I want a shared `<Card>` component with three visual variants, so that every card-like container across the app uses the same padding, radius, shadow, and background choices.

#### Acceptance Criteria

1. The mobile app shall define a `Card` component exported from `src/design-system/components/Card.tsx`.
2. The `Card` component shall accept a `variant` prop with three allowed values: `elevated` (default), `outlined`, `flat`.
3. The `elevated` variant shall use `radius.lg`, `padding[5]`, `colors.white` background, and the `shadows.card` token.
4. The `outlined` variant shall use `radius.lg`, `padding[5]`, `colors.white` background, a 1px `colors.neutral[200]` border, and no shadow.
5. The `flat` variant shall use `radius.lg`, `padding[5]`, `colors.neutral[50]` background, and no shadow.
6. The `Card` component shall accept a `style` override prop with `StyleProp<ViewStyle>` typing so consumers can adjust margins or width without forking the component.
7. The `Card` component shall accept children via standard React children props.
8. The `Card` component shall NOT introduce any new visual style — the three variants shall map to styles that already exist in the codebase, consolidated.
9. The following reference screens shall migrate their card-like containers to use `<Card>`: `ResumesScreen.tsx`, `SavedJobsScreen.tsx`, `JobList.tsx`, `JobDetailScreen.tsx`, `EditProfileScreen.tsx`, `ProfileScreen.tsx`. The migration shall be visually identical (or closer to the canonical recipe).

### Requirement 5: Chip Shared Component

**Objective:** As a mobile developer, I want a shared `<Chip>` component with three size variants, so that every chip/badge across the app uses the same padding, radius, font, and color choices.

#### Acceptance Criteria

1. The mobile app shall define a `Chip` component exported from `src/design-system/components/Chip.tsx`.
2. The `Chip` component shall accept a `size` prop with three allowed values: `sm`, `md`, `lg`.
3. The `size="sm"` variant shall use `padding[1]` vertical × `padding[3]` horizontal, `typography.fontSize.bodySm`, `radius.pill`, and `colors.primary[50]` background.
4. The `size="md"` variant shall use `padding[2]` vertical × `padding[3]` horizontal, `typography.fontSize.body`, `radius.pill`, and `colors.primary[50]` background.
5. The `size="lg"` variant shall use `padding[2]` vertical × `padding[4]` horizontal, `typography.fontSize.body`, `radius.pill`, and `colors.primary[50]` background.
6. The `Chip` component shall accept a `label` prop (string) for the chip text and an optional `icon` prop (React node, rendered left of the label).
7. The `Chip` component shall accept a `style` override prop and a `textStyle` override prop for fine-grained control.
8. The following reference usages shall migrate to `<Chip>`: `JobCard.tsx:170`, `JobDetailScreen.tsx:318`, `JobDetailScreen.tsx:347` (skill chip), `EditProfileScreen.tsx:302` (level chip), `ProfileScreen.tsx:270`, `HomeScreen.tsx:179`. The migration shall pick the size variant that best matches the current visual.
9. The `JobCard.tsx:217,230` legacy skill tags using `padding[1]/2` arithmetic shall be replaced with `<Chip size="sm">`.

### Requirement 6: EmptyState Shared Component

**Objective:** As a mobile developer, I want a shared `<EmptyState>` component, so that the three screens that currently copy-paste the same empty-state block reach for a single source of truth.

#### Acceptance Criteria

1. The mobile app shall define an `EmptyState` component exported from `src/design-system/components/EmptyState.tsx`.
2. The `EmptyState` component shall accept the following props: `icon` (React node), `title` (string), `description` (string, optional), `action` (object with `{ label: string, onPress: () => void }`, optional).
3. The `EmptyState` component shall render a centered column with: icon at top (48px), title in `typography.fontSize.h4` semibold, description in `typography.fontSize.bodySm` `colors.neutral[600]` (when provided), and an action button below using the existing button styling.
4. The `EmptyState` component shall use `padding[8]` horizontal and `padding[4]` bottom for the icon's margin — matching the current copy-pasted values from `ResumesScreen.tsx:212,214`, `SavedJobsScreen.tsx:183,185`, and `JobList.tsx:99,103`.
5. The `ResumesScreen.tsx`, `SavedJobsScreen.tsx`, and `JobList.tsx` empty-state blocks shall be deleted and replaced with a single `<EmptyState>` invocation per screen. Visual output shall be perceptibly identical.
6. The `EmptyState` component shall be importable as `import { EmptyState } from '@/design-system/components/EmptyState'`.

### Requirement 7: IconButton Shared Component

**Objective:** As a mobile developer, I want a shared `<IconButton>` component for the 40×40 circular icon-only buttons used in headers, so that the back button, the bookmark button, and similar interactions look and behave identically.

#### Acceptance Criteria

1. The mobile app shall define an `IconButton` component exported from `src/design-system/components/IconButton.tsx`.
2. The `IconButton` component shall accept the following props: `icon` (React node or `{ family, name, size?, color? }` for the existing `Icon` component), `onPress` (function), `accessibilityLabel` (string), `variant` (optional, `'neutral' | 'transparent'`, default `'neutral'`).
3. The `variant="neutral"` variant shall render a 40×40 circle with `colors.neutral[100]` background and the icon in `colors.neutral[800]`.
4. The `variant="transparent"` variant shall render a 40×40 circle with no background and the icon in `colors.neutral[800]`.
5. The component shall include a `hitSlop` of 8px on all sides by default for accessibility.
6. The following reference usages shall migrate to `<IconButton>`: `JobDetailScreen.tsx` (back button in header), `HomeScreen.tsx` (notification bell button), `ResumePreviewScreen.tsx` (back button in header), `ResumesScreen.tsx` (back button in header, if any). The migration shall be visually identical.

### Requirement 8: StickyBottomBar Pattern

**Objective:** As a mobile developer, I want a `<StickyBottomBar>` component for the bottom action area on job-detail-style screens, so that the "Gerar Currículo" sticky bar and similar future bars use the same padding, height, and safe-area handling.

#### Acceptance Criteria

1. The mobile app shall define a `StickyBottomBar` component exported from `src/design-system/components/StickyBottomBar.tsx`.
2. The `StickyBottomBar` component shall accept a `children` prop and an optional `style` override prop.
3. The component shall render a `View` positioned at the bottom of its parent with `borderTopWidth: 1`, `borderTopColor: colors.neutral[200]`, `colors.white` background, `paddingHorizontal: spacing[5]`, `paddingTop: spacing[3]`, `paddingBottom: spacing[5]`.
4. The component shall include a safe-area-aware bottom inset using `useSafeAreaInsets()` so the bar does not overlap the iOS home indicator.
5. The `JobDetailScreen.tsx` bottom sticky bar (currently an inline `<View style={styles.stickyBar}>`) shall migrate to `<StickyBottomBar>`. Visual output shall be perceptibly identical.
6. The `StickyBottomBar` component shall be importable as `import { StickyBottomBar } from '@/design-system/components/StickyBottomBar'`.
7. The component shall be optional: if no other screen uses a sticky bar, this requirement reduces to documenting the padding recipe in `structure.md` only and skipping the component file.

### Requirement 9: Header Padding Normalization

**Objective:** As a mobile developer, I want every screen header to use one of two documented padding recipes, so that the top of every screen has consistent visual weight.

#### Acceptance Criteria

1. The mobile app shall document the two header padding recipes in a new "Mobile Design System" subsection of `.kiro/steering/structure.md`:
   - **Detail header** (used on JobDetail, ResumePreview): `paddingHorizontal: spacing[4]`, `paddingVertical: spacing[2]`, `borderBottomWidth: 1`, `borderBottomColor: colors.neutral[200]`
   - **List header** (used on Resumes, SavedJobs): `paddingHorizontal: spacing[5]`, `paddingTop: spacing[5]`, `paddingBottom: spacing[3]`
2. The `JobDetailScreen.tsx` header (currently `spacing[4] / spacing[2] / spacing[2]` with border) shall match the documented "Detail header" recipe.
3. The `ResumePreviewScreen.tsx` header (currently `spacing[4] / spacing[2]` with border) shall match the documented "Detail header" recipe.
4. The `ResumesScreen.tsx` and `SavedJobsScreen.tsx` headers (currently `spacing[5] / spacing[5] / spacing[3]` without border) shall match the documented "List header" recipe.
5. The `HomeScreen.tsx` header (currently `spacing[4] / spacing[3]` without border) shall be reclassified — it shall either match the "Detail header" recipe or be explicitly documented as an exception.
6. After migration, no screen header shall use a header-padding combination outside the two documented recipes unless explicitly noted in `structure.md`.

### Requirement 10: Screen-Edge Horizontal Padding Normalization

**Objective:** As a mobile developer, I want every screen's horizontal padding to follow a documented rule, so that the left/right edges of every screen align visually.

#### Acceptance Criteria

1. The mobile app shall document the screen-edge horizontal padding rule in `structure.md`:
   - **Standard list/screen scroll content**: `paddingHorizontal: spacing[4]` (16)
   - **Auth screens (Login, Register)**: `paddingHorizontal: spacing[6]` (24) — centered form exception
   - **Sticky bottom bar**: `paddingHorizontal: spacing[5]` (20)
2. The `JobDetailScreen.tsx` scroll content (currently `spacing[5]`) shall migrate to `spacing[4]`.
3. The `ProfileScreen.tsx` scroll content (currently `spacing[5]`) shall migrate to `spacing[4]`.
4. The `EditProfileScreen.tsx` scroll content (currently `spacing[5]` or similar) shall migrate to `spacing[4]`.
5. The `LoginScreen.tsx` and `RegisterScreen.tsx` shall retain `spacing[6]` (documented exception).
6. After migration, every screen's `paddingHorizontal` value shall be one of: `spacing[4]`, `spacing[5]`, or `spacing[6]` — and which one it is shall be defensible from the documented rule.

### Requirement 11: Spacing Arithmetic Fix in JobCard

**Objective:** As a mobile developer, I want the `spacing[1] / 2` arithmetic in `JobCard.tsx:217,230` removed, so that no production code derives a value from another token by division.

#### Acceptance Criteria

1. The `JobCard.tsx:217,230` legacy skill tags using `paddingVertical: spacing[1] / 2` shall be replaced with `<Chip size="sm">` (per Requirement 5).
2. No file in the mobile app shall use a numeric expression involving token arithmetic (addition, subtraction, multiplication, division) after this requirement is implemented.
3. If a value is needed that no current token provides, a new token shall be added to the relevant family rather than deriving it arithmetically.

### Requirement 12: Font Size Tokenization

**Objective:** As a mobile developer, I want every `fontSize` in the app to come from `typography.fontSize.*`, so that typography is fully tokenized.

#### Acceptance Criteria

1. The following hardcoded `fontSize` values shall be replaced with `typography.fontSize.*` tokens:
   - `HeroSection.tsx:60` `fontSize: 32` → `typography.fontSize.h2`
   - `LoginScreen.tsx:159` and `RegisterScreen.tsx:188` `fontSize: 40` → `typography.fontSize.h1`
   - `Input.tsx:46` `fontSize: 16` → `typography.fontSize.body`
2. After migration, no file in the mobile app shall use a numeric literal for `fontSize` outside `src/design-system/tokens/typography.ts`.
3. The migration shall be visually identical (no font-size changes are introduced by this spec).

### Requirement 13: Orphaned Button Component Resolution

**Objective:** As a mobile developer, I want the orphaned `Button.tsx` in `design-system/components/` either wired into real usage or deleted, so that no dead code remains in the design-system layer.

#### Acceptance Criteria

1. The `Button` component in `src/design-system/components/Button.tsx` shall be evaluated for adoption: at least three reference screens shall be capable of replacing their inline `TouchableOpacity`-with-button-style with `<Button>`.
2. If the adoption is feasible, the `JobDetailScreen.tsx` "Gerar Currículo" button, `LoginScreen.tsx` "Entrar" button, and `RegisterScreen.tsx` "Criar conta" button shall migrate to `<Button>`.
3. If the adoption is NOT feasible (e.g., the inline buttons need visual/behavior tweaks that the current `Button` does not support), the `Button.tsx` file shall be deleted and a comment in `structure.md` shall note that the design-system intentionally has no shared button until a real need emerges.
4. After this requirement is implemented, `Button.tsx` shall either be imported by ≥ 3 production screens OR shall not exist.
