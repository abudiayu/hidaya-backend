-- ============================================================
-- Hidaya SMS — Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- ============================================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  login_id   VARCHAR(20) UNIQUE NOT NULL,
  full_name  VARCHAR(100) NOT NULL,
  email      VARCHAR(100) UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(20) NOT NULL DEFAULT 'teacher' CHECK (role IN ('owner','manager','assistant','teacher')),
  income     NUMERIC(15,2) DEFAULT 0,
  avatar_url VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STUDENTS
CREATE TABLE IF NOT EXISTS students (
  id           SERIAL PRIMARY KEY,
  student_code VARCHAR(10) UNIQUE NOT NULL,
  full_name    VARCHAR(100) NOT NULL,
  full_name_am VARCHAR(100),
  grade        VARCHAR(20) NOT NULL,
  age          SMALLINT,
  gender       VARCHAR(10) CHECK (gender IN ('Male','Female','Other')),
  phone        VARCHAR(20),
  email        VARCHAR(100),
  avatar_url   VARCHAR(255),
  status       VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active','Inactive','Suspended')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TEACHERS
CREATE TABLE IF NOT EXISTS teachers (
  id            SERIAL PRIMARY KEY,
  teacher_code  VARCHAR(10) UNIQUE NOT NULL,
  user_id       INT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  full_name     VARCHAR(100) NOT NULL,
  subject       VARCHAR(80) NOT NULL,
  department    VARCHAR(80),
  branch        VARCHAR(80) DEFAULT 'Main Campus',
  age           SMALLINT,
  gender        VARCHAR(10) CHECK (gender IN ('Male','Female','Other')),
  phone         VARCHAR(20),
  email         VARCHAR(100),
  experience    VARCHAR(40),
  rating        NUMERIC(3,1) DEFAULT 0.0,
  status        VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active','On Leave','Inactive')),
  avatar_url    VARCHAR(255),
  current_topic VARCHAR(200),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teacher_classes (
  id         SERIAL PRIMARY KEY,
  teacher_id INT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_name VARCHAR(30) NOT NULL
);

-- 4. ASSISTANTS
CREATE TABLE IF NOT EXISTS assistants (
  id               SERIAL PRIMARY KEY,
  assistant_code   VARCHAR(10) UNIQUE NOT NULL,
  user_id          INT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  full_name        VARCHAR(100) NOT NULL,
  role_title       VARCHAR(80) DEFAULT 'Junior Assistant',
  department       VARCHAR(80),
  age              SMALLINT,
  gender           VARCHAR(10) CHECK (gender IN ('Male','Female','Other')),
  phone            VARCHAR(20),
  email            VARCHAR(100),
  experience       VARCHAR(40),
  rating           NUMERIC(3,1) DEFAULT 0.0,
  status           VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active','On Leave','Inactive')),
  avatar_url       VARCHAR(255),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assistant_responsibilities (
  id             SERIAL PRIMARY KEY,
  assistant_id   INT NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  responsibility VARCHAR(100) NOT NULL
);

-- 5. ATTENDANCE
CREATE TABLE IF NOT EXISTS attendance (
  id           SERIAL PRIMARY KEY,
  entity_type  VARCHAR(20) NOT NULL CHECK (entity_type IN ('student','teacher','assistant')),
  entity_id    INT NOT NULL,
  date         DATE NOT NULL,
  status       VARCHAR(10) NOT NULL DEFAULT 'Present' CHECK (status IN ('Present','Absent','Late')),
  confirmed_by INT REFERENCES users(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,
  UNIQUE(entity_type, entity_id, date)
);

-- 6. DAILY TOPICS
CREATE TABLE IF NOT EXISTS daily_topics (
  id           SERIAL PRIMARY KEY,
  teacher_id   INT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject      VARCHAR(80) NOT NULL,
  date         DATE NOT NULL,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  submitted_at TIME,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TIMETABLE
CREATE TABLE IF NOT EXISTS timetable (
  id         SERIAL PRIMARY KEY,
  day_name   VARCHAR(5) NOT NULL CHECK (day_name IN ('Mon','Tue','Wed','Thu','Fri')),
  period     VARCHAR(10) NOT NULL,
  subject    VARCHAR(80),
  teacher_id INT REFERENCES teachers(id) ON DELETE SET NULL,
  grade      VARCHAR(10),
  class_name VARCHAR(10),
  updated_by INT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(day_name, period)
);

-- 8. TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id            SERIAL PRIMARY KEY,
  assigned_by   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignee_type VARCHAR(20) NOT NULL CHECK (assignee_type IN ('teacher','assistant')),
  assignee_id   INT NOT NULL,
  description   TEXT NOT NULL,
  due_date      DATE,
  status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','overdue')),
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SUBJECTS + RESULTS
CREATE TABLE IF NOT EXISTS subjects (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(80) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_results (
  id           SERIAL PRIMARY KEY,
  student_id   INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id   INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  semester     VARCHAR(10) NOT NULL CHECK (semester IN ('sem1','sem2')),
  assignment   SMALLINT DEFAULT 0,
  class_work   SMALLINT DEFAULT 0,
  mid_exam     SMALLINT DEFAULT 0,
  final_exam   SMALLINT DEFAULT 0,
  total        SMALLINT GENERATED ALWAYS AS (assignment + class_work + mid_exam + final_exam) STORED,
  grade_label  VARCHAR(4),
  submitted_by INT REFERENCES users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_id, semester)
);

-- 10. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id          SERIAL PRIMARY KEY,
  student_id  INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount      NUMERIC(10,2) NOT NULL,
  is_paid     BOOLEAN NOT NULL DEFAULT FALSE,
  paid_date   DATE,
  term        VARCHAR(40),
  recorded_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ZAKAT RECORDS
CREATE TABLE IF NOT EXISTS zakat_records (
  id            SERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  annual_income NUMERIC(15,2) NOT NULL,
  nisab_value   NUMERIC(15,2) NOT NULL,
  zakat_amount  NUMERIC(15,2) NOT NULL,
  is_liable     BOOLEAN NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SPONSORSHIPS
CREATE TABLE IF NOT EXISTS sponsorships (
  id            SERIAL PRIMARY KEY,
  donor_name    VARCHAR(100) NOT NULL,
  amount        NUMERIC(15,2) NOT NULL,
  description   TEXT,
  received_date DATE NOT NULL,
  status        VARCHAR(20) DEFAULT 'received' CHECK (status IN ('received','pending','cancelled')),
  recorded_by   INT REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 13. REPORTS
CREATE TABLE IF NOT EXISTS reports (
  id                SERIAL PRIMARY KEY,
  generated_by      INT REFERENCES users(id) ON DELETE SET NULL,
  term              VARCHAR(40) NOT NULL,
  student_avg_score NUMERIC(5,2),
  teacher_task_rate NUMERIC(5,2),
  attendance_rate   NUMERIC(5,2),
  top_grade         VARCHAR(20),
  total_students    SMALLINT,
  total_teachers    SMALLINT,
  total_assistants  SMALLINT,
  notes             TEXT,
  comment           TEXT,
  document_name     VARCHAR(255),
  document_data     BYTEA,
  document_type     VARCHAR(100),
  status            VARCHAR(10) DEFAULT 'draft' CHECK (status IN ('draft','sent')),
  sent_at           TIMESTAMPTZ,
  sent_by           INT REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 14. SETTINGS
CREATE TABLE IF NOT EXISTS settings (
  id         SERIAL PRIMARY KEY,
  key_name   VARCHAR(100) UNIQUE NOT NULL,
  value      TEXT,
  updated_by INT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SEED DATA ──────────────────────────────────────────────────────────────────
INSERT INTO subjects (name) VALUES
  ('Mathematics'),('Science'),('English'),('Arabic'),
  ('History'),('Physics'),('Chemistry'),('Biology')
ON CONFLICT (name) DO NOTHING;

INSERT INTO settings (key_name, value) VALUES
  ('school_name',           'Hidaya Islamic Academy'),
  ('school_year',           '2025-2026'),
  ('current_term',          'Term 1 2026'),
  ('nisab_value',           '595'),
  ('payment_amount_grade7', '1200'),
  ('payment_amount_grade8', '1500'),
  ('payment_amount_grade9', '1800')
ON CONFLICT (key_name) DO NOTHING;

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','students','teachers','assistants','tasks','payments','student_results','timetable']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated ON %s', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t, t);
  END LOOP;
END $$;
