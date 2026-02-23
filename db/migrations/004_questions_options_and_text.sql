-- Migration: 004_questions_options_and_text
-- Adds options column for custom option labels (2-6 options per question)
-- Adds 'text' control type for text input questions
-- options: JSONB array of option labels for radio/checkbox (e.g. ["2","4","6","8"])
-- For true_false, options can be ["True","False"] or null (UI defaults)
-- For text, options is null

BEGIN;

-- Add options column
ALTER TABLE questions ADD COLUMN IF NOT EXISTS options JSONB;

-- Extend control_type to include 'text'
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_control_type_check;
ALTER TABLE questions ADD CONSTRAINT questions_control_type_check
  CHECK (control_type IN ('radio', 'checkbox', 'true_false', 'text'));

COMMIT;
