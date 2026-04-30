CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS skills text[];

UPDATE jobs j
SET skills = (
    SELECT ARRAY_AGG(js.skill ORDER BY js.skill)
    FROM job_skills js
    WHERE js.job_id = j.id
)
WHERE EXISTS (
    SELECT 1 FROM job_skills js WHERE js.job_id = j.id
);

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE jobs SET search_vector =
    setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(array_to_string(skills, ' '), '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(description, '')), 'C');

CREATE INDEX IF NOT EXISTS idx_jobs_search ON jobs USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm ON jobs USING GIN(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_name_trgm ON companies USING GIN(name gin_trgm_ops);

CREATE OR REPLACE FUNCTION sync_job_skills_array()
RETURNS TRIGGER AS $$
DECLARE
    v_job_id BIGINT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_job_id := OLD.job_id;
    ELSE
        v_job_id := NEW.job_id;
    END IF;

    IF EXISTS (SELECT 1 FROM jobs WHERE id = v_job_id) THEN
        UPDATE jobs
        SET skills = (
            SELECT ARRAY_AGG(skill ORDER BY skill)
            FROM job_skills
            WHERE job_id = v_job_id
        ),
        search_vector =
            setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
            setweight(to_tsvector('portuguese', coalesce(array_to_string(
                (SELECT ARRAY_AGG(skill ORDER BY skill) FROM job_skills WHERE job_id = v_job_id), ' '), '')), 'B') ||
            setweight(to_tsvector('portuguese', coalesce(description, '')), 'C')
        WHERE id = v_job_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_job_skills_array ON job_skills;
CREATE TRIGGER trg_sync_job_skills_array
AFTER INSERT OR UPDATE OR DELETE ON job_skills
FOR EACH ROW
EXECUTE FUNCTION sync_job_skills_array();

CREATE OR REPLACE FUNCTION update_jobs_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('portuguese', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('portuguese', coalesce(array_to_string(NEW.skills, ' '), '')), 'B') ||
        setweight(to_tsvector('portuguese', coalesce(NEW.description, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_search_vector ON jobs;
CREATE TRIGGER trg_update_search_vector
BEFORE INSERT OR UPDATE OF title, description, skills ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_jobs_search_vector();