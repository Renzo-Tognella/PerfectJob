# Product Overview

PerfectJob is an academic full-stack job-search platform (authors: Gustavo Machado & Renzo Tognella) that lets candidates find and apply to jobs, recruiters publish and manage them, and the system auto-ingest jobs from public APIs.

## Core Capabilities

- **Candidate mobile app** — search/filter jobs (keyword, work model, seniority), apply, save favorites, track application status, manage profile (skills, experience, education, languages), upload CV (PDF → auto-extracted skills/experience/contacts), receive in-app notifications.
- **Recruiter admin web** — dashboard with statistics, full CRUD for jobs and companies, review incoming applications.
- **Public REST API** — versioned (`/api/v1/...`) endpoints for auth, jobs, companies, applications, search, notifications, profile, admin ingestion; stateless JWT auth.
- **Automated job ingestion** — scheduled + on-demand import from Remotive and Arbeitnow public APIs, normalized into the `jobs` table with `(source, external_id)` deduplication.
- **CV analyzer** — PDFBox-based extractor that feeds the candidate profile.

## Target Use Cases

- **Job candidate** on a phone browsing and applying to jobs with a polished native-style UX.
- **Recruiter** on a desktop browser managing their company's job postings and reviewing candidates.
- **Platform admin** triggering manual ingestion runs and monitoring trending skills.
- **Academic reviewer** evaluating the design patterns, best-practices adherence, and integration quality (see `docs/`, `analise/`).

## Value Proposition

Three loosely-coupled applications that **actually work together end-to-end**: one-command startup (`./start.sh` brings up Postgres, Redis, API, mobile, admin), real data flow (no mocks in the candidate-facing surfaces), full-text search via PostgreSQL native capabilities, and an ingestion pipeline that keeps the catalog fresh without manual entry.

## Design Tokens (UI)

- **Primary:** `#2B5FC2`
- **Accent:** `#FF6B35`
- **Success:** `#16A34A`
- Mobile and admin both reference the same brand palette — keep new UI screens on these tokens rather than hardcoding hex values.

## Non-Goals (Academic Scope)

- No payments, no email delivery (notifications are in-app only), no production-grade observability stack.
- Multi-language UI is **out**; the product copy is in Portuguese (`pt-BR`), while codebase/code is in English.

---

_Focus on patterns and purpose, not exhaustive feature lists_
