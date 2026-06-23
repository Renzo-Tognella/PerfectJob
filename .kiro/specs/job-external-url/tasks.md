# Tasks: job-external-url

## Task 1: Database migration V9

_Boundary: Database schema (Flyway migrations)_
_Depends: none_

- [x] 1.1 Create `perfectjob-api/src/main/resources/db/migration/V9__add_job_external_url.sql`
  - Add `ALTER TABLE jobs ADD COLUMN external_url VARCHAR(2048);`
  - Column is nullable (manually-created jobs may not have a URL).
  - No index, no unique constraint (URL is never a query key).
  - Include a header comment block matching the V8 style.
  - **Done**: V9 migration exists, applies cleanly on top of V8, and `jobs` table has a nullable `external_url VARCHAR(2048)` column.

## Task 2: Job entity + ingestion mapper fix

_Boundary: Backend domain model + ingestion pipeline_
_Depends: 1.1_

- [x] 2.1 Add `externalUrl` field to `Job.java` entity
  - Add `@Column(name = "external_url", length = 2048) private String externalUrl;` in the "External ingestion tracking" section (after `externalId`, line 123).
  - Lombok `@Data` generates accessors — do not write getter/setter by hand.
  - **Done**: `Job` entity has an `externalUrl` field mapped to `jobs.external_url`.

- [x] 2.2 Fix `JobIngestionMapper.toJob()` to pass URL through
  - Add `.externalUrl(ext.url())` to the `Job.builder()` chain in `JobIngestionMapper.java` (line 32–48).
  - The `url` component is already populated by both `RemotiveJobSource` and `ArbeitnowJobSource`.
  - **Done**: Calling `JobIngestionMapper.toJob(ext, companyId)` with a non-null `ext.url()` produces a `Job` whose `externalUrl` equals `ext.url()`.

## Task 3: API response DTO + response mapper

_Boundary: Backend API response layer_
_Depends: 2.1_

- [x] 3.1 Add `externalUrl` to `JobResponse` record
  - Add `String externalUrl` as the **final** component of the `JobResponse` record (after `expiresAt`, line 38).
  - **Done**: `JobResponse` record has an `externalUrl` component.

- [x] 3.2 Update `JobMapper.toResponse()` to map the field
  - Add `job.getExternalUrl()` as the final argument in the `new JobResponse(...)` constructor call (after `job.getExpiresAt()`, line 39).
  - **Done**: `JobMapper.toResponse(job)` returns a `JobResponse` whose `externalUrl` matches the entity's value (null included).

## Task 4: Admin job creation request DTO + service wiring

_Boundary: Backend API request layer + service orchestration_
_Depends: 2.1_

- [x] 4.1 Add optional `externalUrl` to `CreateJobRequest`
  - Add `@Size(max = 2048) String externalUrl` as the final component of the `CreateJobRequest` record (after `expiresAt`, line 33).
  - No `@NotBlank` — it is optional.
  - **Done**: `POST /v1/jobs` and `PATCH /v1/jobs/{id}` accept an optional `externalUrl` field; missing/null leaves the entity field null.

- [x] 4.2 Wire `externalUrl` into `JobService` create/update flow
  - In `JobService.create()` (line 56–74): add `.externalUrl(request.externalUrl())` to the `Job.builder()` chain.
  - In `JobService.update()` (line 127–140): add `job.setExternalUrl(request.externalUrl());` alongside the other setters.
  - **Done**: A `CreateJobRequest` with `externalUrl` set results in the value persisted on the `Job` entity (both create and update paths).

## Task 5: Backend tests

_Boundary: Backend test layer_
_Depends: 2.2, 3.2, 4.2_

- [x] 5.1 Update/extend `JobIngestionMapperTest` (existing unit test)
  - Add test: `toJob` with non-null `url` produces entity with matching `externalUrl`.
  - Add test: `toJob` with null `url` produces entity with null `externalUrl`.
  - **Done**: Both tests pass; mapper URL plumbing is verified without a Spring context.

- [x] 5.2 Update/extend `JobMapperTest` or controller integration test
  - Verify `JobResponse.externalUrl` is populated (non-null) for an ingested job.
  - Verify `JobResponse.externalUrl` is null for a manually-created job without a URL.
  - **Done**: Integration test confirms the API returns the `externalUrl` field correctly.

## Task 6: Admin API types + Zod schema

_Boundary: Admin data + validation layer_
_Depends: 3.2, 4.1_

- [x] 6.1 Add `externalUrl` to admin `Job` and `JobInput` types
  - Add `externalUrl?: string;` to both the `Job` interface and the `JobInput` interface in `perfectjob-admin/src/services/api/jobApi.ts`.
  - **Done**: Admin types include the optional URL field.

- [x] 6.2 Add validated optional URL field to admin `jobSchema`
  - Add `externalUrl: z.string().url('URL inválida').or(z.literal('')).optional()` to the `jobSchema` object in `perfectjob-admin/src/schemas/job.ts`.
  - **Done**: Valid HTTP(S) URLs pass validation; empty string and undefined pass; malformed values produce "URL inválida" error.

## Task 7: Admin job form — URL field

_Boundary: Admin job form UI_
_Depends: 6.1, 6.2_

- [x] 7.1 Add URL input and wiring to `JobFormModal.tsx`
  - `toFormInput()`: add `externalUrl: job?.externalUrl ?? ''` (and `externalUrl: ''` in the new-job default branch).
  - `toApiPayload()`: add `externalUrl: data.externalUrl || undefined` (undefined on PATCH = no change).
  - Add an `<Input>` labeled "URL da vaga (opcional)" with `type="url"`, registered via `{...register('externalUrl')}`, with error display. Place it after the location fields, before Skills.
  - **Done**: The admin form shows an optional URL field; editing a job with a URL pre-populates it; submitting an invalid URL shows a validation error and blocks submission.

## Summary

| Metric | Value |
|---|---|
| Major tasks | 7 |
| Sub-tasks | 9 |
| Requirements covered | 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2 |
| Apps touched | API (7 files), Admin (3 files) |
| New files | 1 (V9 migration) |
| Modified files | 9 |

> **Mobile `externalUrl` display** (types, mappers, "Ver vaga original" button on JobDetailScreen) is owned by `mobile-resume-experience`, NOT this spec. This spec delivers the backend `JobResponse.externalUrl` field only.

### Dependency graph

```
1.1 (V9 migration)
 └─ 2.1 (Job entity)
     ├─ 2.2 (ingestion mapper) ──┐
     ├─ 3.1 → 3.2 (DTO + mapper) ─┤
     └─ 4.1 → 4.2 (request DTO) ─┤
                                 ├─ 5.1, 5.2 (backend tests)
                                 └─ 6.1, 6.2 (admin types/schema)
                                          └─ 7.1 (admin UI)
```
