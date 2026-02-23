-- Migration: 005_seed_questions_with_options
-- Replaces sample survey questions with new format:
-- - options column: actual answer labels (2-6 options for radio/checkbox)
-- - text control type for text input questions

BEGIN;

DELETE FROM questions WHERE survey_id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';

-- ─── True/False (2 options, labels = answers) ─────────────────────────────────

INSERT INTO questions (survey_id, question_text, control_type, options, correct_answers, display_order)
VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Humans need to breathe air to survive.', 'true_false', '["True", "False"]', '["True"]', 0),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Robots can feel emotions like happiness or sadness.', 'true_false', '["True", "False"]', '["False"]', 1),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'The sun rises in the east.', 'true_false', '["True", "False"]', '["True"]', 2),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Water is dry.', 'true_false', '["True", "False"]', '["False"]', 3);

-- ─── Radio: 4 options, labels = actual values ──────────────────────────────────

INSERT INTO questions (survey_id, question_text, control_type, options, correct_answers, display_order)
VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'How many legs does a human have?', 'radio', '["2", "4", "6", "8"]', '["2"]', 4),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'How many seasons are there in a year?', 'radio', '["1", "2", "3", "4"]', '["4"]', 5),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'How many legs does a spider have?', 'radio', '["4", "6", "8", "10"]', '["8"]', 6),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'What is 2 + 2?', 'radio', '["3", "4", "5", "6"]', '["4"]', 7);

-- ─── Radio: 3 options (variable count) ─────────────────────────────────────────

INSERT INTO questions (survey_id, question_text, control_type, options, correct_answers, display_order)
VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'How many days are in a week?', 'radio', '["5", "6", "7"]', '["7"]', 8);

-- ─── Radio: 6 options ──────────────────────────────────────────────────────────

INSERT INTO questions (survey_id, question_text, control_type, options, correct_answers, display_order)
VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'How many continents are there?', 'radio', '["3", "4", "5", "6", "7", "8"]', '["7"]', 9);

-- ─── Checkbox: 4 options, labels = actual values ──────────────────────────────

INSERT INTO questions (survey_id, question_text, control_type, options, correct_answers, display_order)
VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Which are colours? Select all that apply.', 'checkbox', '["Red", "Carrot", "Blue", "Potato"]', '["Red", "Blue"]', 10),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Select the even numbers.', 'checkbox', '["2", "3", "4", "5"]', '["2", "4"]', 11),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Which are fruits? Select all correct.', 'checkbox', '["Apple", "Bread", "Banana", "Chicken"]', '["Apple", "Banana"]', 12);

-- ─── Checkbox: 5 options (variable count) ─────────────────────────────────────

INSERT INTO questions (survey_id, question_text, control_type, options, correct_answers, display_order)
VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Select all mammals.', 'checkbox', '["Dog", "Fish", "Cat", "Snake", "Whale"]', '["Dog", "Cat", "Whale"]', 13);

-- ─── Text input questions ──────────────────────────────────────────────────────

INSERT INTO questions (survey_id, question_text, control_type, options, correct_answers, display_order)
VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'What planet do humans live on? (one word)', 'text', NULL, '["Earth", "earth"]', 14),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'What is the first letter of the alphabet?', 'text', NULL, '["A", "a"]', 15),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Type the word "human" to verify you are not a robot.', 'text', NULL, '["human", "Human"]', 16);

COMMIT;
