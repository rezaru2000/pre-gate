-- Migration: 006_survey_questions_per_session
-- Adds configurable number of random questions shown per user session.
-- When > 0 (e.g. 5), each user gets that many questions randomly picked from the pool.
-- When 0 or null, all questions are shown (backward compatible).

BEGIN;

ALTER TABLE surveys ADD COLUMN IF NOT EXISTS questions_per_session INTEGER DEFAULT 5;

-- Existing surveys: default to 5 random questions
UPDATE surveys SET questions_per_session = 5 WHERE questions_per_session IS NULL;

COMMIT;
