# Technology Stack

## Architecture

Three-tier **monorepo with three independently deployable applications**, sharing a single Postgres database and Redis cache. The API is the only writer; mobile and admin are pure consumers.

```
┌────────────────────┐    ┌────────────────────┐
│  perfectjob-mobile │    │  perfectjob-admin  │
│  (Expo / RN 0.81)  │    │  (React 19 / Vite) │
└──────────┬─────────┘    └──────────┬──────────┘
           │ HTTPS / JWT (Bearer)     │
           └────────────┬─────────────┘
                        ▼
              ┌─────────────────────┐
              │  perfectjob-api     │
              │  Spring Boot 3.3.5  │
              │  Java 21 (records)  │
              └──────┬────────┬─────┘
                     │        │
              ┌──────▼──┐  ┌──▼──────┐
              │ Postgres│  │  Redis  │
              │   16    │  │   7     │
              └─────────┘  └─────────┘
```

## Core Technologies

- **API**: Spring Boot 3.3.5, Java 21 (records, sealed types where useful), Maven (wrapper committed)
- **Mobile**: React Native 0.81.5 + Expo SDK 54 + React 19.1 + TypeScript 5.6
- **Admin**: React 19 + Vite 6 + TypeScript 5.5 + Tailwind 3.4
- **Database**: PostgreSQL 16 (uses native `tsvector` + `pg_trgm` for full-text search and trigram suggestions)
- **Cache**: Redis 7
- **Auth**: JWT (HS256, 15 min) — stateless, validated by a single Spring Security filter
- **Infra**: Docker Compose for Postgres + Redis (and optionally the API image `maven:3.9-eclipse-temurin-21`)

## Key Libraries

### API (`perfectjob-api/pom.xml`)

- `spring-boot-starter-{web, data-jpa, security, validation, cache, data-redis}`
- `flyway-core` + `flyway-database-postgresql` — schema migrations in `src/main/resources/db/migration/V{n}_*.sql`
- `io.jsonwebtoken:jjwt-{api,impl,jackson}` 0.12.5 — JWT issue/parse
- `org.projectlombok:lombok` 1.18.46 — boilerplate reduction (treat as required)
- `org.springdoc:springdoc-openapi-starter-webmvc-ui` 2.5.0 — Swagger UI at `/swagger-ui.html`
- `org.apache.pdfbox:pdfbox` 3.0.3 — CV text extraction

### Mobile (`perfectjob-mobile/package.json`)

- `@tanstack/react-query` 5.x — server state
- `zustand` 5.x — client state
- `axios` 1.7 — HTTP client
- `react-hook-form` 7 + `@hookform/resolvers` + `zod` 4 — forms + schema validation
- `@react-navigation/{native,native-stack,bottom-tabs}` 7.x
- `expo-secure-store` — JWT at rest; `react-native-mmkv` — non-sensitive persisted state
- `jest` + `jest-expo` for testing

### Admin (`perfectjob-admin/package.json`)

- `@tanstack/react-query` 5.x, `zustand` 5.x, `axios` 1.7
- `react-hook-form` 7 + `zod` 4
- `react-router-dom` 7
- `tailwindcss` 3.4 + `tailwind-merge` + `clsx` + `class-variance-authority` for variants
- `@headlessui/react`, `lucide-react` (icons), `sonner` (toasts)

## Development Standards

### Type Safety

- **API**: Java 21 records for DTOs; Lombok for entities; `@Valid` + Bean Validation on controller bodies.
- **Mobile & Admin**: TypeScript strict mode; Zod schemas as single source of truth, inferred types via `z.infer`.

### Code Quality

- API uses Lombok — **never** write getters/setters/builders by hand.
- Mobile and admin both run ESLint (`npm run lint`); admin has `--max-warnings 0`.

### Testing

- API: Spring Boot Test + Spring Security Test + H2 (test scope). Surefire configured with `-XX:+EnableDynamicAgentLoading` for ByteBuddy on Java 21.
- Mobile: Jest + `jest-expo` preset; tests live in `__tests__/` next to source.

### Page Serialization

`PerfectJobApplication` enables `@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)` — controllers must return `Page<T>` via DTOs, never raw entities.

## Development Environment

### Required Tools

- **Docker** (Desktop) — Postgres + Redis (always); API optional fallback
- **Node.js 20+** with npm — mobile and admin
- **Java 21** — optional; the API runs in Docker if missing

### Common Commands

```bash
# One-shot up: Postgres + Redis + API + Mobile (Metro) + Admin
./start.sh

# Just the infra (Postgres + Redis)
./setup.sh
# or
docker compose up -d postgres redis

# API (host Java)
cd perfectjob-api && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Mobile (offline mode avoids Expo 500s)
cd perfectjob-mobile && npm install && npx expo start --offline

# Admin
cd perfectjob-admin && npm install && npm run dev
```

## Key Technical Decisions

- **Stateless JWT (no refresh tokens, 15 min TTL)** — academic scope; in production, add a refresh-token table and rotate on use.
- **No ORM features hidden from the developer** — JPA repositories + Specification Pattern for dynamic search (`JobSpecification`); avoid derived `findByX` chains longer than 3 fields.
- **Ingestion dedup by `(source, external_id)`** — keep the unique constraint and never accept duplicates.
- **`./start.sh` writes `perfectjob-mobile/.env` with the LAN IP** so a physical phone on the same Wi-Fi can reach the API. Never hardcode `localhost` in mobile code — read `API_URL` from `expo-constants`.
- **Expo must run `--offline`** — interactive/tunnel mode throws HTTP 500 in non-interactive shells.
- **Migrations are append-only** — never edit `V{n}__*.sql` once merged; add a new `V{n+1}__*.sql`.

---

_Document standards and patterns, not every dependency_
