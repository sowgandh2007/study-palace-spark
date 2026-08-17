-- ECHO Learning Loop Tables
-- Migration: Add dedicated tables for the ECHO assessment workflow

-- 1. Echo Reflections: Student self-assessment before probe
CREATE TABLE IF NOT EXISTS echo_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL,
  concept_name TEXT NOT NULL,
  confidence INTEGER NOT NULL DEFAULT 50,
  understood_text TEXT DEFAULT '',
  not_understood_text TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE echo_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reflections"
  ON echo_reflections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reflections"
  ON echo_reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reflections"
  ON echo_reflections FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Echo Assessments: Full stability result after probe evaluation
CREATE TABLE IF NOT EXISTS echo_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_name TEXT NOT NULL,
  confidence_input INTEGER NOT NULL DEFAULT 50,
  stability_score INTEGER NOT NULL DEFAULT 0,
  confidence_gap INTEGER NOT NULL DEFAULT 0,
  is_confident_but_fragile BOOLEAN NOT NULL DEFAULT false,
  band_label TEXT NOT NULL DEFAULT 'Surface Knowledge',
  evaluations JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendation TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE echo_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own assessments"
  ON echo_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments"
  ON echo_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Echo Timetable: Student schedule entries
CREATE TABLE IF NOT EXISTS echo_timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  time TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE echo_timetable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own timetable"
  ON echo_timetable FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own timetable"
  ON echo_timetable FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own timetable"
  ON echo_timetable FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Echo Learn Materials: Saved study materials / PDF summaries
CREATE TABLE IF NOT EXISTS echo_learn_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'topic',
  file_name TEXT,
  html_content TEXT DEFAULT '',
  summary_text TEXT DEFAULT '',
  key_concepts JSONB NOT NULL DEFAULT '[]'::jsonb,
  important_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  page_count INTEGER,
  word_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE echo_learn_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own learn materials"
  ON echo_learn_materials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learn materials"
  ON echo_learn_materials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Echo Repair Activities: Targeted remediation tasks
CREATE TABLE IF NOT EXISTS echo_repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_name TEXT NOT NULL,
  gap_text TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'Medium',
  total_minutes INTEGER NOT NULL DEFAULT 0,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  before_score INTEGER NOT NULL DEFAULT 0,
  after_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE echo_repairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own repairs"
  ON echo_repairs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own repairs"
  ON echo_repairs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own repairs"
  ON echo_repairs FOR UPDATE
  USING (auth.uid() = user_id);

-- 6. Echo Recheck History: Before/after verification scores
CREATE TABLE IF NOT EXISTS echo_rechecks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  before_score INTEGER NOT NULL DEFAULT 0,
  after_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE echo_rechecks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own rechecks"
  ON echo_rechecks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rechecks"
  ON echo_rechecks FOR INSERT
  WITH CHECK (auth.uid() = user_id);
