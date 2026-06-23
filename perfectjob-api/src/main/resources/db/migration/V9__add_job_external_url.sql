-- =============================================
-- PerfectJob - Job external URL (V9)
-- Stores the original posting URL from external
-- sources (Remotive, Arbeitnow) or manual entry.
-- =============================================

ALTER TABLE jobs ADD COLUMN external_url VARCHAR(2048);
