-- =============================================
-- PerfectJob - Candidate languages (V8)
-- Spoken languages with proficiency level.
-- =============================================

CREATE TABLE user_languages (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language        VARCHAR(100) NOT NULL,
    level           VARCHAR(50),
    display_order   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_user_languages_user ON user_languages(user_id);
