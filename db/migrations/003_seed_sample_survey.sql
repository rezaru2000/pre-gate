-- Migration: 003_seed_sample_survey
-- Inserts a sample survey with anti-bot questions to filter out robots and automated tools.
-- Questions require human understanding: common sense, reading comprehension, basic reasoning.
-- Survey link: /s/f47ac10b-58cc-4372-a567-0e02b2c3d479

BEGIN;

INSERT INTO surveys (id, name, actual_url, pass_mark_percent, invite_uuid, is_active)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'PreGate Human Verification',
  'https://example.com/actual-survey',
  80,
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- Replace any existing questions for this survey (idempotent re-runs)
DELETE FROM questions WHERE survey_id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';

-- ─── True/False: Obvious facts that require human common sense ─────────────────

INSERT INTO questions (survey_id, question_text, control_type, correct_answers, display_order)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Humans need to breathe air to survive.',
  'true_false',
  '["True"]',
  0
);

INSERT INTO questions (survey_id, question_text, control_type, correct_answers, display_order)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Robots can feel emotions like happiness or sadness.',
  'true_false',
  '["False"]',
  1
);

INSERT INTO questions (survey_id, question_text, control_type, correct_answers, display_order)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'The sun rises in the east.',
  'true_false',
  '["True"]',
  2
);

INSERT INTO questions (survey_id, question_text, control_type, correct_answers, display_order)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Water is dry.',
  'true_false',
  '["False"]',
  3
);

INSERT INTO questions (survey_id, question_text, control_type, correct_answers, display_order)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'People need to sleep to stay healthy.',
  'true_false',
  '["True"]',
  4
);

-- ─── Radio: Requires reading the question and mapping to options (A=1st, B=2nd, C=3rd, D=4th) ───

INSERT INTO questions (survey_id, question_text, control_type, correct_answers, display_order)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'How many legs does a human have? Select the option for the correct number. (A=2, B=4, C=6, D=8)',
  'radio',
  '["Option A"]',
  5
);

INSERT INTO questions (survey_id, question_text, control_type, correct_answers, display_order)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'How many seasons are there in a year? (A=1, B=2, C=3, D=4)',
  'radio',
  '["Option D"]',
  6
);

INSERT INTO questions (survey_id, question_text, control_type, correct_answers, display_order)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'How many legs does a spider have? (A=4, B=6, C=8, D=10)',
  'radio',
  '["Option C"]',
  7
);

INSERT INTO questions (survey_id, question_text, control_type, correct_answers, display_order)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'What is 2 + 2? (A=3, B=4, C=5, D=6)',
  'radio',
  '["Option B"]',
  8
);

-- ─── Checkbox: Multi-select requires understanding which options apply ─────────

INSERT INTO questions (survey_id, question_text, control_type, correct_answers, display_order)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Which options represent colours? Select all that apply. (A=Red, B=Carrot, C=Blue, D=Potato)',
  'checkbox',
  '["Option A", "Option C"]',
  9
);

INSERT INTO questions (survey_id, question_text, control_type, correct_answers, display_order)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Select the even numbers. (A=2, B=3, C=4, D=5)',
  'checkbox',
  '["Option A", "Option C"]',
  10
);

INSERT INTO questions (survey_id, question_text, control_type, correct_answers, display_order)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Which are fruits? Select all correct. (A=Apple, B=Bread, C=Banana, D=Chicken)',
  'checkbox',
  '["Option A", "Option C"]',
  11
);

COMMIT;
