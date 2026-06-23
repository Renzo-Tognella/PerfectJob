# Design Document

## Overview

The mobile-design-system spec establishes a real design-system layer for the PerfectJob mobile app by adding three missing token families (`radius`, `shadows`, `lineHeight`), extracting five repeated visual patterns into shared components (`Card`, `Chip`, `EmptyState`, `IconButton`, `StickyBottomBar`), and documenting a padding matrix so every screen reaches for the same value for the same concept.

The approach is **vertical-slice consolidation**: each task = one token family OR one component, plus a reference-screen migration that proves the token/component works. The order is dependency-driven (tokens before components, simple components before composed ones).

## Architecture

### Token Layer

```
src/design-system/tokens/
├── colors.ts        (existing — no changes)
├── spacing.ts       (existing — no changes)
├── typography.ts    (extend: add lineHeight sub-object)
├── radius.ts        (NEW)
├── shadows.ts       (NEW)
└── index.ts         (NEW — barrel re-exporting all tokens)
```

**Token additions (in order of appearance):**

- `radius.ts` — `{ xs: 2, sm: 6, md: 8, lg: 12, xl: 14, xxl: 16, pill: 9999, avatar: 48 }`
- `shadows.ts` — `{ card, sheet, fab }` React-Native shadow tuples with `shadowColor/Offset/Opacity/Radius/elevation`
- `typography.ts` extended with `lineHeight: { tight: 20, normal: 24, relaxed: 28, loose: 32, display: 40 }`
- `index.ts` — single barrel: `export { colors } from './colors'; export { spacing } from './spacing'; export { typography } from './typography'; export { radius } from './radius'; export { shadows } from './shadows';`

### Component Layer

```
src/design-system/components/
├── Button.tsx         (existing — wired up OR deleted per Requirement 13)
├── Card.tsx           (NEW)
├── Chip.tsx           (NEW)
├── EmptyState.tsx     (NEW)
├── IconButton.tsx     (NEW)
└── StickyBottomBar.tsx (NEW — only if at least 2 screens need it; else documented only)
```

**Component contracts (key props only):**

- `Card({ variant: 'elevated' | 'outlined' | 'flat', children, style })` — 3 visual variants, all using `radius.lg` + `padding[5]`. Variants differ only by background/border/shadow.
- `Chip({ size: 'sm' | 'md' | 'lg', label, icon?, style?, textStyle? })` — 3 size variants, all using `radius.pill`. Differ in vertical/horizontal padding and fontSize.
- `EmptyState({ icon, title, description?, action?: { label, onPress } })` — single recipe; matches the copy-pasted block in 3 screens.
- `IconButton({ icon, onPress, accessibilityLabel, variant?: 'neutral' | 'transparent' })` — 40×40 circle, two visual variants.
- `StickyBottomBar({ children, style? })` — bottom-anchored, safe-area-aware, fixed padding recipe.

### Migration Strategy

Each token/component migration is **visually identical** — the consolidation is structural, not visual. To prove this:

1. Each task captures the "before" style values from the target file:line.
2. The replacement uses tokens/components that produce the same numeric values.
3. Visual regression is checked by running the app on a real device after the wave.

The order is:

| Wave | Tasks | Why this order |
|------|-------|----------------|
| 1 | Token foundations (radius, shadows, lineHeight) | Components depend on these |
| 2 | `tokens/index.ts` barrel | Lets new files use the consolidated import path |
| 3 | `Card` + `Chip` (the two most-used components) | Highest reuse; migrate first to maximize impact |
| 4 | `EmptyState` (1 component, 3 references) | Single migration replaces 3 copy-paste blocks |
| 5 | `IconButton` + `StickyBottomBar` (smaller adoption) | Polish pass |
| 6 | Header + screen-edge padding normalization | Uses the documented matrix from steering |
| 7 | JobCard spacing-arithmetic fix + font-size tokenization | Cleanup of last hardcoded values |
| 8 | `Button` resolution (wire up or delete) | Final design-system consistency check |

### Steering Document Update

A new "Mobile Design System" subsection in `.kiro/steering/structure.md` documents:

- The two header padding recipes (detail vs list) with rationale
- The three screen-edge horizontal padding values (16 / 20 / 24) with which to use when
- The radius token family (where each value applies)
- The shadow token family (which elevation = which recipe)
- The font-size + lineHeight pairing convention (h1 → lineHeight.display, body → lineHeight.normal, etc.)

This is the long-lived reference that future work must respect.

## Key Technical Decisions

### Decision 1: Vertical-Slice Refactor over Token-First or Component-First

**Chosen**: vertical-slice.
**Why**: token-first leaves screens inconsistent until the very last task; component-first exposes missing tokens mid-task. Vertical-slice keeps the codebase buildable and visually coherent at every commit.
**Rejected**: Big-bang migration in a single PR — too risky for an 8-task refactor across 13+ files.

### Decision 2: `Card` Variants Cover the 3 Distinct Visual Styles

**Chosen**: three variants (`elevated`, `outlined`, `flat`).
**Why**: the codebase has 3 distinct card visual recipes today (JobCard, ResumesScreen card, ProfileScreen statsRow). Three variants capture them without forcing a redesign.
**Rejected**: one variant + style overrides — would leak the visual decision into every consumer.

### Decision 3: `StickyBottomBar` Component Only if 2+ Screens Need It

**Chosen**: create the component if at least 2 screens need a sticky bottom bar; otherwise document the recipe in `structure.md` and skip the file.
**Why**: YAGNI. Today only JobDetailScreen has a sticky bar. If only one screen needs the pattern, an inline styled `View` is fine; the recipe is documented so future bars copy the right values.
**Rejected**: always create the component — adds a file with one consumer, no reuse value.

### Decision 4: Wire `Button.tsx` to 3 Reference Screens or Delete It

**Chosen**: evaluate; either adopt in 3 screens (JobDetail, Login, Register) or delete.
**Why**: dead code rots. Either we commit to using it everywhere or we delete it. Leaving it as "we might use it later" is the worst outcome.
**Rejected**: keep it dormant — would never get adopted without forcing it; sets a bad precedent.

### Decision 5: JSDoc Usage Examples, Not Storybook

**Chosen**: each new component file has a JSDoc block at the top with usage examples.
**Why**: zero infra cost; the file's own header is the canonical reference. Adding Storybook would require a new dev dependency and a separate build.
**Rejected**: Storybook runtime — overkill for an academic-scope project.

## Data Model

No persistent data model changes. This spec is purely structural.

## API Contracts

No API changes. The mobile app does not expose any new endpoints or change request/response shapes.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Visual regression: migration accidentally changes a screen's look | Each task captures the "before" values; the replacement is verified to produce the same numeric outputs. Manual smoke-test on a real device after each wave. |
| Token conflict: two screens using `spacing[5]` for "the same concept" but wanting different values | The padding matrix documents the canonical choice; conflicts are resolved by picking the dominant value and migrating the minority. |
| `Button.tsx` adoption breaks visual/behavior | If the button has any visual mismatch, do not force adoption — delete it instead (Decision 4). |
| Component API growth (Card variant explosion) | Three variants max. If a fourth visual style emerges, add it; otherwise consumers use `style` override. |
| Scope creep into redesign | Strict "consolidation, not redesign" rule. If a task would change a screen's look, it is out of scope. |

## Testing Strategy

- **Visual**: after each wave, run the app on a real device (or Expo Go) and check that the affected screens look identical to before the wave.
- **Unit**: each new component has a snapshot test in `src/design-system/components/__tests__/`.
- **No backend tests** are needed — this spec touches only `perfectjob-mobile/`.
- **Lint/typecheck**: `npx tsc --noEmit` after each wave to confirm no type regressions.

## Migration Sequencing

This spec touches 13+ files. To minimize risk, the implementation is sequenced so each task lands on a stable foundation:

1. **Tokens first** (radius, shadows, lineHeight, index barrel): no consumer behavior change.
2. **Components next** (Card, Chip, EmptyState, IconButton, StickyBottomBar): added but no migration yet.
3. **Migration waves** (each screen file): consume the new tokens/components. Each migration is visually identical.
4. **Final cleanup** (Button resolution, font-size tokenization, spacing-arithmetic fix): remove the last hardcoded values.

Each step is independently committable and reviewable.
