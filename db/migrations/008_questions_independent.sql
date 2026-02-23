-- Migration: 008_questions_independent
-- Questions are independent (global pool). Remove survey_id from questions table.

BEGIN;

-- Drop FK and column
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_survey_id_fkey;
ALTER TABLE questions DROP COLUMN IF EXISTS survey_id;

-- Update indexes
DROP INDEX IF EXISTS idx_questions_survey_id;
DROP INDEX IF EXISTS idx_questions_display_order;
CREATE INDEX IF NOT EXISTS idx_questions_display_order ON questions(display_order);

COMMIT;
