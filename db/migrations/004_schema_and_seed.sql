-- Migration: 004_schema_and_seed
-- Adds options column, text control type, questions_per_session.
-- Replaces sample questions with new format using real option values.

BEGIN;

-- Schema: options column
ALTER TABLE questions ADD COLUMN IF NOT EXISTS options JSONB;

-- Schema: extend control_type to include 'text'
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_control_type_check;
ALTER TABLE questions ADD CONSTRAINT questions_control_type_check
  CHECK (control_type IN ('radio', 'checkbox', 'true_false', 'text'));

-- Schema: questions per session
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS questions_per_session INTEGER DEFAULT 5;
UPDATE surveys SET questions_per_session = 5 WHERE questions_per_session IS NULL;

COMMIT;

-- Ensure pool has questions if empty (runs outside transaction for conditional logic)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM questions) = 0 THEN
    INSERT INTO questions (question_text, control_type, options, correct_answers, display_order) VALUES
    ('Humans need to breathe air to survive.', 'true_false', '["True", "False"]', '["True"]', 0),
    ('Robots can feel emotions.', 'true_false', '["True", "False"]', '["False"]', 1),
    ('The sun rises in the east.', 'true_false', '["True", "False"]', '["True"]', 2),
    ('How many legs does a human have?', 'radio', '["2", "4", "6", "8"]', '["2"]', 3),
    ('What is 2 + 2?', 'radio', '["3", "4", "5", "6"]', '["4"]', 4),
    ('How many seasons in a year?', 'radio', '["1", "2", "3", "4"]', '["4"]', 5),
    ('Type "human" to verify.', 'text', NULL, '["human", "Human"]', 6);
  END IF;
END $$;
