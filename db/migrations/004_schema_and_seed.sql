-- Migration: 004_schema_and_seed
-- Adds options column, text control type, questions_per_session.
-- Replaces sample questions with new format. Ensures pool has questions if empty.

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

-- Seed: replace sample survey questions with new format
DELETE FROM questions WHERE survey_id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';

INSERT INTO questions (survey_id, question_text, control_type, options, correct_answers, display_order)
VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Humans need to breathe air to survive.', 'true_false', '["True", "False"]', '["True"]', 0),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Robots can feel emotions like happiness or sadness.', 'true_false', '["True", "False"]', '["False"]', 1),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'The sun rises in the east.', 'true_false', '["True", "False"]', '["True"]', 2),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Water is dry.', 'true_false', '["True", "False"]', '["False"]', 3),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'How many legs does a human have?', 'radio', '["2", "4", "6", "8"]', '["2"]', 4),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'How many seasons are there in a year?', 'radio', '["1", "2", "3", "4"]', '["4"]', 5),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'How many legs does a spider have?', 'radio', '["4", "6", "8", "10"]', '["8"]', 6),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'What is 2 + 2?', 'radio', '["3", "4", "5", "6"]', '["4"]', 7),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'How many days are in a week?', 'radio', '["5", "6", "7"]', '["7"]', 8),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'How many continents are there?', 'radio', '["3", "4", "5", "6", "7", "8"]', '["7"]', 9),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Which are colours? Select all that apply.', 'checkbox', '["Red", "Carrot", "Blue", "Potato"]', '["Red", "Blue"]', 10),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Select the even numbers.', 'checkbox', '["2", "3", "4", "5"]', '["2", "4"]', 11),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Which are fruits? Select all correct.', 'checkbox', '["Apple", "Bread", "Banana", "Chicken"]', '["Apple", "Banana"]', 12),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Select all mammals.', 'checkbox', '["Dog", "Fish", "Cat", "Snake", "Whale"]', '["Dog", "Cat", "Whale"]', 13),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'What planet do humans live on? (one word)', 'text', NULL, '["Earth", "earth"]', 14),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'What is the first letter of the alphabet?', 'text', NULL, '["A", "a"]', 15),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Type the word "human" to verify you are not a robot.', 'text', NULL, '["human", "Human"]', 16);

COMMIT;

-- Ensure pool has questions if empty (runs outside transaction for conditional logic)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM questions) = 0 THEN
    INSERT INTO surveys (id, name, actual_url, pass_mark_percent, invite_uuid, is_active, questions_per_session)
    VALUES ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'PreGate Human Verification', 'https://example.com/actual-survey', 80, 'f47ac10b-58cc-4372-a567-0e02b2c3d479', TRUE, 5)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO questions (survey_id, question_text, control_type, options, correct_answers, display_order) VALUES
    ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Humans need to breathe air to survive.', 'true_false', '["True", "False"]', '["True"]', 0),
    ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Robots can feel emotions.', 'true_false', '["True", "False"]', '["False"]', 1),
    ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'The sun rises in the east.', 'true_false', '["True", "False"]', '["True"]', 2),
    ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'How many legs does a human have?', 'radio', '["2", "4", "6", "8"]', '["2"]', 3),
    ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'What is 2 + 2?', 'radio', '["3", "4", "5", "6"]', '["4"]', 4),
    ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'How many seasons in a year?', 'radio', '["1", "2", "3", "4"]', '["4"]', 5),
    ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Type "human" to verify.', 'text', NULL, '["human", "Human"]', 6);
  END IF;
END $$;
