-- =============================================
-- PerfectJob - Candidate profile fields (V6)
-- Adds resume/profile data extracted from CV analysis
-- =============================================

-- ---------------------------------------------
-- Extra profile columns on users
-- ---------------------------------------------
ALTER TABLE users ADD COLUMN headline           VARCHAR(255);
ALTER TABLE users ADD COLUMN location_city       VARCHAR(100);
ALTER TABLE users ADD COLUMN location_state      VARCHAR(100);
ALTER TABLE users ADD COLUMN years_experience    INTEGER;
ALTER TABLE users ADD COLUMN resume_url          VARCHAR(500);
ALTER TABLE users ADD COLUMN resume_text         TEXT;
ALTER TABLE users ADD COLUMN resume_updated_at   TIMESTAMP;

-- ---------------------------------------------
-- Table: user_skills (competencias) - mirrors job_skills
-- ---------------------------------------------
CREATE TABLE user_skills (
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill       VARCHAR(100) NOT NULL,
    PRIMARY KEY (user_id, skill)
);

-- ---------------------------------------------
-- Table: user_experiences (experiencias profissionais)
-- ---------------------------------------------
CREATE TABLE user_experiences (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    company         VARCHAR(255),
    start_date      VARCHAR(50),
    end_date        VARCHAR(50),
    description     TEXT,
    display_order   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_user_experiences_user ON user_experiences(user_id);

-- ---------------------------------------------
-- Table: user_education (formacao academica)
-- ---------------------------------------------
CREATE TABLE user_education (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution     VARCHAR(255) NOT NULL,
    degree          VARCHAR(255),
    field_of_study  VARCHAR(255),
    start_year      INTEGER,
    end_year        INTEGER,
    display_order   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_user_education_user ON user_education(user_id);
