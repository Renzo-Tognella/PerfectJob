-- =============================================
-- PerfectJob - External job ingestion tracking (V7)
-- Lets the platform import jobs from external APIs and avoid duplicates.
-- =============================================

ALTER TABLE jobs ADD COLUMN source       VARCHAR(50);
ALTER TABLE jobs ADD COLUMN external_id  VARCHAR(255);

-- One row per (source, external_id). NULLs are distinct in Postgres, so
-- manually created jobs (source IS NULL) are unaffected.
CREATE UNIQUE INDEX uq_jobs_source_external ON jobs(source, external_id);
CREATE INDEX idx_jobs_source ON jobs(source);
