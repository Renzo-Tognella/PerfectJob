# Brief: job-external-url

## Problem

Candidates using PerfectJob cannot access the original job posting. The ingestion pipeline (Remotive, Arbeitnow) already fetches the job URL in `ExternalJob.url`, but `JobIngestionMapper.toJob()` discards it. The `Job` entity has no URL column, the API doesn't expose one, and the mobile app has no "open original posting" link. This is especially important now that candidates generate resumes instead of applying in-platform — they need to apply directly on the source site.

## Current State

- `ExternalJob.java` (ingestion DTO record): **has** `url` field, populated correctly by both `RemotiveJobSource` and `ArbeitnowJobSource`.
- `JobIngestionMapper.toJob()`: maps `ExternalJob` → `Job` entity but **drops** `url`.
- `Job.java` entity: **no** `url` / `external_url` field.
- `JobResponse` DTO: **no** URL field.
- Mobile job detail screen: no "open original" link.
- Latest Flyway migration: `V8__add_user_languages.sql`. Next = V9.

## Desired Outcome

- Every ingested job has its external URL persisted in the database.
- Manually created jobs (via admin) can optionally have a URL.
- The API exposes the URL in `JobResponse`.
- The mobile job detail screen shows a "Ver vaga original" button that opens the URL in the device browser.
- The admin job form has an optional URL field.

## Approach

Add `external_url VARCHAR(2048)` column to `jobs` table (nullable — manually created jobs may not have one). Thread it through the mapper, entity, DTO, and mobile types. Display as an external link on the job detail screen.

## Scope

- **In**:
  - V9 migration: `ALTER TABLE jobs ADD COLUMN external_url VARCHAR(2048)`
  - `Job.java`: add `externalUrl` field
  - `JobIngestionMapper.toJob()`: pass `externalJob.url()` through
  - `JobResponse` DTO + `JobMapper`: add `externalUrl`
  - Mobile: update `Job` type, show "Ver vaga original" link on JobDetailScreen (opens via `Linking.openURL`)
  - Admin: add optional URL field to job form
- **Out**:
  - URL validation (beyond basic format check)
  - Shortening or proxying URLs
  - Click tracking / analytics
  - Changes to the search index

## Boundary Candidates

- Ingestion mapper is the single point where the URL was lost — fix is localized to `JobIngestionMapper.toJob()`.
- DTO/entity plumbing is mechanical (add field, update mapper).
- Mobile display is one new button on JobDetailScreen.

## Out of Boundary

- Resume generation (Spec: ai-resume-generator)
- Mobile tab rename / UI rework (Spec: mobile-resume-experience, but the job-detail link is small enough to include here)
- Changes to ingestion scheduling or dedup logic

## Upstream / Downstream

- **Upstream**: External APIs (Remotive, Arbeitnow) already return URLs. No upstream changes.
- **Downstream**: Resume generation spec reads `Job` data (including URL) but doesn't depend on it. Mobile UI spec will also display the link on the resume detail screen.

## Existing Spec Touchpoints

- **Extends**: none (first spec in this project)
- **Adjacent**: `ai-resume-generator` (reads Job entity, benefits from having the URL for context but doesn't require it)

## Constraints

- Migration is append-only: V9, never modify V1–V8.
- `external_url` must be nullable (admin-created jobs may not have one).
- Column type VARCHAR(2048) to accommodate long URLs with query params.
- URL is from external sources — treat as untrusted (display only, no server-side fetch/preview).
