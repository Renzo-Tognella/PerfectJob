-- =============================================
-- PerfectJob - Resume entity (V10)
-- AI-tailored PDF resumes generated per (user, job).
-- Replaces the legacy applications table.
-- V9 is reserved for job-external-url spec.
-- =============================================

CREATE TABLE resumes (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id          BIGINT NOT NULL REFERENCES jobs(id),
    pdf_storage_path VARCHAR(1024) NOT NULL,
    latex_source    TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_resumes_user ON resumes(user_id);
CREATE INDEX idx_resumes_user_job ON resumes(user_id, job_id);

DROP TABLE IF EXISTS applications;
