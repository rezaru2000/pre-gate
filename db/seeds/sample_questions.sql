-- ─── Sample Survey + Questions Seed ─────────────────────────────────────────
-- Run this in Azure Data Studio against your local database to get test data.
--
-- NOTE: Radio and checkbox options are currently hard-coded in the UI as:
--   ['Option A', 'Option B', 'Option C', 'Option D']
-- So correct_answers must use exactly those strings.
-- True/False options are hard-coded as ['True', 'False'].
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- Step 1: Insert a sample survey
INSERT INTO surveys (name, actual_url, pass_mark_percent)
VALUES (
  'Sample Verification Survey',
  'https://example.com/actual-survey',
  80
);

-- Step 2: Insert questions into global pool (questions are independent of surveys)
INSERT INTO questions (question_text, control_type, correct_answers, display_order)
VALUES
  ('The internet was invented before the telephone.', 'true_false', '["False"]', 1),
  ('Humans need oxygen to survive.', 'true_false', '["True"]', 2),
  ('Which of these is the correct answer to select? (Pick Option B)', 'radio', '["Option B"]', 3),
  ('A single correct choice question — the answer is Option D.', 'radio', '["Option D"]', 4),
  ('Select ALL correct options: Option A and Option C are both correct.', 'checkbox', '["Option A", "Option C"]', 5),
  ('Select ALL correct options: Option B, Option C, and Option D are all correct.', 'checkbox', '["Option B", "Option C", "Option D"]', 6);

COMMIT;

-- ─── Verify the data ─────────────────────────────────────────────────────────
SELECT display_order AS "#", control_type AS type, question_text AS question, correct_answers AS correct
FROM questions ORDER BY display_order;
