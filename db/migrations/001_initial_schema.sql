-- Migration: 001_initial_schema
-- Creates all core tables for PreGate

BEGIN;

-- gen_random_uuid() is built into PostgreSQL 13+ without any extension

-- ─── surveys ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS surveys (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  actual_url        TEXT NOT NULL,
  pass_mark_percent INTEGER NOT NULL DEFAULT 80,
  invite_uuid       UUID UNIQUE DEFAULT gen_random_uuid(),
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ─── questions ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id       UUID REFERENCES surveys(id) ON DELETE CASCADE,
  question_text   TEXT NOT NULL,
  control_type    TEXT CHECK (control_type IN ('radio', 'checkbox', 'true_false')),
  correct_answers JSONB NOT NULL,
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_survey_id ON questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_questions_display_order ON questions(survey_id, display_order);

-- ─── responses ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id       UUID REFERENCES surveys(id),
  user_session_id TEXT NOT NULL,
  answers         JSONB NOT NULL,
  score_percent   NUMERIC(5,2),
  passed          BOOLEAN,
  ip_address      TEXT,
  user_agent      TEXT,
  submitted_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_responses_survey_id ON responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_responses_submitted_at ON responses(submitted_at DESC);

-- ─── admin_users ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS surveys_updated_at ON surveys;
CREATE TRIGGER surveys_updated_at
  BEFORE UPDATE ON surveys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
