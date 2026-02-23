-- Migration: 003_seed_sample_survey
-- Inserts a sample survey and initial question pool.
-- Questions are a global pool (not tied to a survey).

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

-- ─── True/False ────────────────────────────────────────────────────────────────

INSERT INTO questions (question_text, control_type, correct_answers, display_order)
VALUES ('Humans need to breathe air to survive.', 'true_false', '["True"]', 0)
ON CONFLICT DO NOTHING;

INSERT INTO questions (question_text, control_type, correct_answers, display_order)
VALUES ('Robots can feel emotions like happiness or sadness.', 'true_false', '["False"]', 1)
ON CONFLICT DO NOTHING;

INSERT INTO questions (question_text, control_type, correct_answers, display_order)
VALUES ('The sun rises in the east.', 'true_false', '["True"]', 2)
ON CONFLICT DO NOTHING;

INSERT INTO questions (question_text, control_type, correct_answers, display_order)
VALUES ('Water is dry.', 'true_false', '["False"]', 3)
ON CONFLICT DO NOTHING;

INSERT INTO questions (question_text, control_type, correct_answers, display_order)
VALUES ('People need to sleep to stay healthy.', 'true_false', '["True"]', 4)
ON CONFLICT DO NOTHING;

-- ─── Radio ─────────────────────────────────────────────────────────────────────

INSERT INTO questions (question_text, control_type, correct_answers, display_order)
VALUES ('How many legs does a human have? (A=2, B=4, C=6, D=8)', 'radio', '["Option A"]', 5)
ON CONFLICT DO NOTHING;

INSERT INTO questions (question_text, control_type, correct_answers, display_order)
VALUES ('How many seasons are there in a year? (A=1, B=2, C=3, D=4)', 'radio', '["Option D"]', 6)
ON CONFLICT DO NOTHING;

INSERT INTO questions (question_text, control_type, correct_answers, display_order)
VALUES ('How many legs does a spider have? (A=4, B=6, C=8, D=10)', 'radio', '["Option C"]', 7)
ON CONFLICT DO NOTHING;

INSERT INTO questions (question_text, control_type, correct_answers, display_order)
VALUES ('What is 2 + 2? (A=3, B=4, C=5, D=6)', 'radio', '["Option B"]', 8)
ON CONFLICT DO NOTHING;

-- ─── Checkbox ──────────────────────────────────────────────────────────────────

INSERT INTO questions (question_text, control_type, correct_answers, display_order)
VALUES ('Which options represent colours? Select all that apply. (A=Red, B=Carrot, C=Blue, D=Potato)', 'checkbox', '["Option A", "Option C"]', 9)
ON CONFLICT DO NOTHING;

INSERT INTO questions (question_text, control_type, correct_answers, display_order)
VALUES ('Select the even numbers. (A=2, B=3, C=4, D=5)', 'checkbox', '["Option A", "Option C"]', 10)
ON CONFLICT DO NOTHING;

INSERT INTO questions (question_text, control_type, correct_answers, display_order)
VALUES ('Which are fruits? Select all correct. (A=Apple, B=Bread, C=Banana, D=Chicken)', 'checkbox', '["Option A", "Option C"]', 11)
ON CONFLICT DO NOTHING;

COMMIT;
