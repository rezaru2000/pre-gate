-- Migration: 009_add_20_questions
-- Adds 20 more anti-bot questions to the global pool.

BEGIN;

INSERT INTO questions (question_text, control_type, options, correct_answers, display_order)
VALUES
  -- True/False
  ('Humans need to eat food to survive.', 'true_false', '["True", "False"]', '["True"]', 17),
  ('Computers can taste food.', 'true_false', '["True", "False"]', '["False"]', 18),
  ('The moon orbits the Earth.', 'true_false', '["True", "False"]', '["True"]', 19),
  ('Ice is colder than boiling water.', 'true_false', '["True", "False"]', '["True"]', 20),
  ('A year has 365 days.', 'true_false', '["True", "False"]', '["True"]', 21),
  -- Radio
  ('How many hours are in a day?', 'radio', '["12", "24", "36", "48"]', '["24"]', 22),
  ('How many sides does a triangle have?', 'radio', '["2", "3", "4", "5"]', '["3"]', 23),
  ('What is 10 - 3?', 'radio', '["5", "6", "7", "8"]', '["7"]', 24),
  ('How many months are in a year?', 'radio', '["6", "10", "12", "14"]', '["12"]', 25),
  ('How many wheels does a bicycle have?', 'radio', '["1", "2", "3", "4"]', '["2"]', 26),
  ('How many minutes are in an hour?', 'radio', '["30", "45", "60", "90"]', '["60"]', 27),
  -- Checkbox
  ('Which are vegetables? Select all correct.', 'checkbox', '["Carrot", "Steak", "Broccoli", "Salmon"]', '["Carrot", "Broccoli"]', 28),
  ('Select all prime numbers.', 'checkbox', '["2", "4", "5", "7"]', '["2", "5", "7"]', 29),
  ('Which are modes of transport? Select all that apply.', 'checkbox', '["Car", "Tree", "Bicycle", "House"]', '["Car", "Bicycle"]', 30),
  ('Select all vowels.', 'checkbox', '["A", "B", "E", "I"]', '["A", "E", "I"]', 31),
  -- Text
  ('What colour is the sky on a clear day? (one word)', 'text', NULL, '["Blue", "blue"]', 32),
  ('How many fingers does a human have? (number)', 'text', NULL, '["10", "ten"]', 33),
  ('What animal says "moo"?', 'text', NULL, '["Cow", "cow"]', 34),
  ('What is 5 times 2? (number)', 'text', NULL, '["10", "ten"]', 35),
  ('Name a season of the year.', 'text', NULL, '["Spring", "Summer", "Autumn", "Fall", "Winter", "spring", "summer", "autumn", "fall", "winter"]', 36);

COMMIT;
