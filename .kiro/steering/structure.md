# Project Structure

## Organization Philosophy

**Modular monolith monorepo**: three top-level application directories (`perfectjob-api/`, `perfectjob-mobile/`, `perfectjob-admin/`) are independent build units (Maven / npm) that share a single database and a single JWT secret. Cross-app contracts live in the API's OpenAPI spec and in shared Zod schemas within each client (kept identical on purpose — see `tech.md`).

Supporting directories (`docs/`, `tasks/`, `analise/`, `relatorios/`, `output/`) hold academic-process artifacts and are **not** application code.

## Directory Patterns

### Root scripts and infra

**Location**: `./`  
**Purpose**: one-shot local environment orchestration; never import from these in app code.  
**Example**: `start.sh` is the canonical "everything up" entry point.

### API — Spring Boot module

**Location**: `perfectjob-api/`  
**Package root**: `com.perfectjob` (all source under `src/main/java/com/perfectjob/`)

**Layered structure** (each layer maps 1:1 to a package, never cross-call skipping a layer):

| Package | Responsibility |
|---|---|
| `controller/v1/` | HTTP entry points. One controller per aggregate. No business logic. |
| `service/` | Business logic, transactions, orchestration. One service per aggregate. |
| `service/mapper/` | Entity ↔ DTO conversions. |
| `service/resume/` | CV analyzer subsystem. |
| `service/ingestion/` | External job ingestion (Remotive, Arbeitnow). |
| `repository/` | Spring Data JPA interfaces. |
| `model/` | JPA entities (Lombok). |
| `dto/` | Request/response records. |
| `event/` | Domain events (async listeners). |
| `exception/` | Custom exceptions + global `@RestControllerAdvice`. |
| `config/` | `@Configuration` classes (security, cache, OpenAPI, etc.). |
| `security/` | JWT filter, `UserDetailsService` impl. |

**Resources** (`src/main/resources/`):

- `application.yml`, `application-dev.yml`, `application-prod.yml` — Spring profiles
- `db/migration/V{n}__*.sql` — **append-only** Flyway migrations

### Mobile — Expo module

**Location**: `perfectjob-mobile/`  
**Entry**: `App.tsx` (registers `RootNavigator`)

**Source layout** (`src/`):

| Folder | Responsibility |
|---|---|
| `navigation/` | `RootNavigator`, `AuthNavigator`, `MainNavigator`, `types.ts` (route param types). |
| `screens/` | One folder per feature (`home/`, `job-detail/`, `applications/`, `saved-jobs/`, `profile/`, `search/`, `auth/`). |
| `components/` | Reusable presentational components (no API calls). |
| `services/` | API clients (axios) + per-feature service modules (`home/`, `profile/`). |
| `hooks/` | `useXxx` wrappers around TanStack Query mutations/queries. |
| `store/` | Zustand stores. |
| `schemas/` | Zod schemas (form validation, API response parsing). |
| `design-system/` | Tokens, theme provider, primitives. |
| `types/` | Shared TypeScript types. |
| `config/` | Env reading, runtime config. |

**Import alias**: `@/` → `src/` (configured in `jest` `moduleNameMapper` and `tsconfig`).

### Admin — Vite module

**Location**: `perfectjob-admin/`  
**Entry**: `src/main.tsx` → `src/App.tsx`

**Source layout** (`src/`):

| Folder | Responsibility |
|---|---|
| `pages/` | Route components (one per route, mostly thin). |
| `components/` | `Layout.tsx` (shell) and `ui/` (primitives: Button, Modal, Toast, etc.). |
| `services/` | `api/` — axios client + per-aggregate services. |
| `hooks/` | TanStack Query wrappers, form hooks. |
| `store/` | Zustand (auth state primarily). |
| `schemas/` | Zod schemas. |
| `lib/`, `utils/` | Pure helpers (cn(), formatters). |
| `styles/` | Global CSS, Tailwind base. |
| `types/` | Shared types. |

**Tailwind + tokens**: design tokens exposed as CSS variables, consumed via `tailwind.config.js` theme extension.

## Naming Conventions

- **Java packages**: lowercase, root `com.perfectjob`; sub-packages are singular nouns (`controller`, `service`, `dto`).
- **Java classes**: PascalCase; controllers end with `Controller`, services with `Service`, JPA entities are singular nouns (`Job`, `Company`), DTOs suffix `Request`/`Response` (`CreateJobRequest`).
- **Migrations**: `V{n}__{snake_case_description}.sql` (e.g., `V8__add_user_languages.sql`).
- **TS/TSX files**: PascalCase for components and types (`JobCard.tsx`, `Job.ts`); camelCase for hooks/utils (`useJobs.ts`, `formatDate.ts`).
- **Folders**: lowercase, kebab-case for multi-word (`saved-jobs/`, `job-detail/`).
- **API routes**: `/api/v1/{resource}` (plural) for collections; sub-resources as `/api/v1/{resource}/{id}/{action}` (e.g., `/api/v1/jobs/{id}/close`).

## Import Organization

### API (Java)

```java
import com.perfectjob.model.Job;                  // same module
import com.perfectjob.repository.JobRepository;   // intra-module
import jakarta.persistence.*;                     // framework (jakarta, not javax)
import org.springframework.web.bind.annotation.*; // framework
```

No wildcard imports. No `javax.*` (Jakarta EE 10+).

### Mobile / Admin (TypeScript)

```typescript
// 1. External packages (alphabetical within group)
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// 2. Internal absolute (@/ alias)
import { JobCard } from '@/components/JobCard';
import type { Job } from '@/types/job';

// 3. Relative (only for tight intra-folder coupling)
import { formatDate } from './formatDate';
```

**Path aliases**:
- Mobile: `@/` → `src/`
- Admin: uses Vite's default `@/` (configure identically if added)

## Code Organization Principles

- **Layer purity (API)**: Controllers never call repositories. Services never call controllers. DTOs never leak entities (the `@EnableSpringDataWebSupport(VIA_DTO)` enforces this for `Page`).
- **Feature folders in clients**: each `screens/<feature>/` folder owns its sub-components; cross-feature shared UI lives in `components/`.
- **Schemas as contract**: define Zod schemas first, infer TS types with `z.infer<typeof X>`. Don't re-declare the shape in TypeScript.
- **Sidecar process dirs are first-class**: `tasks/TASK-NNN-{slug}.md` is a work unit; `analise/{TASK-NNN,…}-analise.md` is its retrospective. Don't move them under `docs/`.
- **One `.env.example` per surface**: root for shared secrets (`DB_PASSWORD`, `JWT_SECRET`), `perfectjob-mobile/.env` is generated by `start.sh` (LAN IP).
- **No cross-app imports**: mobile and admin **must not** import each other's source. Shared contracts are the API's OpenAPI doc + manually-mirrored Zod schemas.

## Mobile Design System

The mobile app's design tokens and shared components live under `perfectjob-mobile/src/design-system/`. Always import from `@/design-system/tokens` (the barrel) and `@/design-system/components/<Name>` — never the deep paths.

### Tokens

| File | Purpose |
|---|---|
| `tokens/colors.ts` | Brand palette (`primary`, `accent`, `neutral`, `success`/`warning`/`error`/`info`) |
| `tokens/spacing.ts` | Numeric spacing scale: `spacing[0..20]` = 0..80 in 4pt increments (most-used: `[4]`=16, `[5]`=20, `[6]`=24) |
| `tokens/typography.ts` | `fontSize.*`, `fontWeight.*`, `lineHeight.*` (tight/normal/relaxed/loose/display) |
| `tokens/radius.ts` | `radius.xs/sm/md/lg/xl/xxl/pill/avatar` for all `borderRadius` values |
| `tokens/shadows.ts` | `shadows.card/sheet/fab` for the three elevation recipes |
| `tokens/index.ts` | Barrel — re-exports everything above |

### Components

| File | Purpose |
|---|---|
| `components/Card.tsx` | Three variants: `elevated` (default, white + shadow), `outlined` (white + border), `flat` (neutral bg) |
| `components/Chip.tsx` | Pill chip with three sizes: `sm`, `md`, `lg` |
| `components/EmptyState.tsx` | Icon + title + description + optional action — replaces 3 copy-pasted blocks |
| `components/IconButton.tsx` | 40×40 circular icon button for headers/toolbars; `neutral` or `transparent` variant |
| `components/StickyBottomBar.tsx` | Bottom-anchored CTA bar with safe-area-aware padding |
| `components/Button.tsx` | Either imported by ≥3 screens OR deleted (do not leave dormant) |

### Padding Matrix

**Screen-edge horizontal padding** (every screen MUST use one of these three values):

| Value | Token | When to use |
|---|---|---|
| 16 | `spacing[4]` | Default list/screen scroll content |
| 20 | `spacing[5]` | Sticky bottom bar |
| 24 | `spacing[6]` | Auth screens only (centered form layout) |

**Header padding** (two recipes):

| Recipe | Padding | Border | Screens |
|---|---|---|---|
| Detail header | `spacing[4]` h, `spacing[2]` v | 1px `colors.neutral[200]` bottom | JobDetail, ResumePreview |
| List header | `spacing[5]` h, `spacing[5]` top, `spacing[3]` bottom | none | Resumes, SavedJobs |

HomeScreen's header is an explicit exception (translucent over hero).

### Radius + Elevation

- `radius.lg` (12) is the default for cards and large containers.
- `radius.md` (8) is the default for buttons, inputs, and small chips.
- `radius.pill` (9999) is for chips and circular avatars.
- `radius.avatar` (48) is half of the standard 96px avatar size.
- `shadows.card` is for resting cards. `shadows.sheet` is for floating sheets/modals. `shadows.fab` is for primary CTAs (matches the existing "Gerar Currículo" shadow recipe).

### Typography Pairing

- `typography.fontSize.h1` → `typography.lineHeight.display` (40 / 40)
- `typography.fontSize.h2` → `typography.lineHeight.loose` (32 / 32)
- `typography.fontSize.body` → `typography.lineHeight.normal` (16 / 24)
- `typography.fontSize.bodySm` → `typography.lineHeight.tight` (14 / 20)

### Migration Discipline

When adding a new screen or component, always:
1. Import tokens from `@/design-system/tokens` (the barrel, not the deep path).
2. Use `<Card>` for card-like containers, `<Chip>` for badges/tags, `<EmptyState>` for empty lists, `<IconButton>` for header icon buttons.
3. Apply one of the three documented screen-edge padding values.
4. Never use a numeric literal for `padding`, `margin`, `borderRadius`, `fontSize`, or `shadowOpacity` outside the token files.

---

_Document patterns, not file trees. New files following patterns shouldn't require updates_
