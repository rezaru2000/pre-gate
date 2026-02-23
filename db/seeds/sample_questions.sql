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

-- Step 2: Insert questions linked to that survey
WITH s AS (
  SELECT id FROM surveys WHERE name = 'Sample Verification Survey' LIMIT 1
)

INSERT INTO questions (survey_id, question_text, control_type, correct_answers, display_order)
VALUES

  -- ── True / False ──────────────────────────────────────────────────────────
  -- Simple yes/no style question. UI renders two radio buttons: True | False.

  ((SELECT id FROM s),
   'The internet was invented before the telephone.',
   'true_false',
   '["False"]',
   1),

  ((SELECT id FROM s),
   'Humans need oxygen to survive.',
   'true_false',
   '["True"]',
   2),

  -- ── Radio (single correct answer) ─────────────────────────────────────────
  -- UI renders 4 radio buttons: Option A | Option B | Option C | Option D.
  -- Only one can be selected. One is correct.

  ((SELECT id FROM s),
   'Which of these is the correct answer to select? (Pick Option B)',
   'radio',
   '["Option B"]',
   3),

  ((SELECT id FROM s),
   'A single correct choice question — the answer is Option D.',
   'radio',
   '["Option D"]',
   4),

  -- ── Checkbox (multiple correct answers) ───────────────────────────────────
  -- UI renders 4 checkboxes: Option A | Option B | Option C | Option D.
  -- Multiple can be selected. ALL listed answers must be selected to be correct.

  ((SELECT id FROM s),
   'Select ALL correct options: Option A and Option C are both correct.',
   'checkbox',
   '["Option A", "Option C"]',
   5),

  ((SELECT id FROM s),
   'Select ALL correct options: Option B, Option C, and Option D are all correct.',
   'checkbox',
   '["Option B", "Option C", "Option D"]',
   6);

COMMIT;

-- ─── Verify the data ─────────────────────────────────────────────────────────
SELECT
  q.display_order   AS "#",
  q.control_type    AS type,
  q.question_text   AS question,
  q.correct_answers AS correct
FROM questions q
JOIN surveys s ON s.id = q.survey_id
WHERE s.name = 'Sample Verification Survey'
ORDER BY q.display_order;
