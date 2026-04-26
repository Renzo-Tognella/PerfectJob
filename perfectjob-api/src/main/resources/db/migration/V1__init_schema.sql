-- =============================================
-- PerfectJob Initial Schema Migration (V1)
-- =============================================

-- ---------------------------------------------
-- CHECK constraints instead of PG enum types (JPA compatibility)
-- ---------------------------------------------

-- ---------------------------------------------
-- Table: users
-- ---------------------------------------------
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'CANDIDATE' CHECK (role IN ('CANDIDATE', 'RECRUITER', 'ADMIN')),
    avatar_url      VARCHAR(500),
    phone           VARCHAR(50),
    bio             TEXT,
    linkedin_url    VARCHAR(500),
    github_url      VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------
-- Table: companies
-- ---------------------------------------------
CREATE TABLE companies (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE,
    description     TEXT,
    logo_url        VARCHAR(500),
    website         VARCHAR(500),
    size            VARCHAR(50),
    industry        VARCHAR(100),
    founded_year    INTEGER,
    rating          DOUBLE PRECISION,
    rating_count    INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------
-- Table: jobs
-- ---------------------------------------------
CREATE TABLE jobs (
    id                  BIGSERIAL PRIMARY KEY,
    company_id          BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title               VARCHAR(255) NOT NULL,
    slug                VARCHAR(255) NOT NULL UNIQUE,
    description         TEXT,
    requirements        TEXT,
    benefits            TEXT,
    salary_min          NUMERIC(12, 2),
    salary_max          NUMERIC(12, 2),
    salary_currency     VARCHAR(3) NOT NULL DEFAULT 'BRL',
    work_model          VARCHAR(20) CHECK (work_model IN ('REMOTE', 'HYBRID', 'ON_SITE')),
    experience_level    VARCHAR(20) CHECK (experience_level IN ('INTERN', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'SPECIALIST')),
    job_type            VARCHAR(20) CHECK (job_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE')),
    contract_type       VARCHAR(20) CHECK (contract_type IN ('CLT', 'PJ', 'COOPERATIVE')),
    location_city       VARCHAR(100),
    location_state      VARCHAR(100),
    location_country    VARCHAR(100) NOT NULL DEFAULT 'Brasil',
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'DRAFT')),
    views               INTEGER NOT NULL DEFAULT 0,
    applications_count  INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at          TIMESTAMP
);

-- ---------------------------------------------
-- Table: applications
-- ---------------------------------------------
CREATE TABLE applications (
    id              BIGSERIAL PRIMARY KEY,
    job_id          BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    cover_letter    TEXT,
    resume_url      VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------
-- Table: saved_jobs
-- ---------------------------------------------
CREATE TABLE saved_jobs (
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id          BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, job_id)
);

-- ---------------------------------------------
-- Table: job_skills
-- ---------------------------------------------
CREATE TABLE job_skills (
    job_id          BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill           VARCHAR(100) NOT NULL,
    PRIMARY KEY (job_id, skill)
);

-- ---------------------------------------------
-- Indexes
-- ---------------------------------------------
CREATE INDEX idx_jobs_status ON jobs(status) WHERE status = 'ACTIVE';
CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_candidate ON applications(candidate_id);
