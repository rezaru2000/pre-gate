-- Migration: 007_ensure_pool_questions
-- Ensures the question pool has sample questions (runs only if pool is empty).
-- Fixes "No questions in the pool" when migrations ran but questions table is empty.

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM questions) = 0 THEN
    -- Ensure sample survey exists
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
