-- ============================================================
-- Hidaya SMS — Full Database Schema (MAMP / MySQL 8)
-- ============================================================
CREATE DATABASE IF NOT EXISTS hidayadb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hidayadb;

-- ============================================================
-- 1. USERS  (all login accounts: owner, manager, assistant, teacher)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  login_id     VARCHAR(20) UNIQUE NOT NULL,
  full_name    VARCHAR(100) NOT NULL,
  email        VARCHAR(100) UNIQUE,
  password     VARCHAR(255) NOT NULL,
  role         ENUM('owner','manager','assistant','teacher') NOT NULL DEFAULT 'teacher',
  income       DECIMAL(15,2) DEFAULT 0,
  avatar_url   VARCHAR(255),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. STUDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  student_code   VARCHAR(10) UNIQUE NOT NULL,
  full_name      VARCHAR(100) NOT NULL,
  full_name_am   VARCHAR(100),
  grade          VARCHAR(20) NOT NULL,
  age            TINYINT UNSIGNED,
  gender         ENUM('Male','Female','Other'),
  phone          VARCHAR(20),
  email          VARCHAR(100),
  avatar_url     VARCHAR(255),
  status         ENUM('Active','Inactive','Suspended') DEFAULT 'Active',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. TEACHERS  (profile data; login is in users table)
-- ============================================================
CREATE TABLE IF NOT EXISTS teachers (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  teacher_code     VARCHAR(10) UNIQUE NOT NULL,
  user_id          INT UNIQUE,
  full_name        VARCHAR(100) NOT NULL,
  subject          VARCHAR(80) NOT NULL,
  department       VARCHAR(80),
  branch           VARCHAR(80) DEFAULT 'Main Campus',
  age              TINYINT UNSIGNED,
  gender           ENUM('Male','Female','Other'),
  phone            VARCHAR(20),
  email            VARCHAR(100),
  experience       VARCHAR(40),
  rating           DECIMAL(3,1) DEFAULT 0.0,
  status           ENUM('Active','On Leave','Inactive') DEFAULT 'Active',
  avatar_url       VARCHAR(255),
  current_topic    VARCHAR(200),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS teacher_classes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id  INT NOT NULL,
  class_name  VARCHAR(30) NOT NULL,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- ============================================================
-- 4. ASSISTANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS assistants (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  assistant_code   VARCHAR(10) UNIQUE NOT NULL,
  user_id          INT UNIQUE,
  full_name        VARCHAR(100) NOT NULL,
  role_title       VARCHAR(80) DEFAULT 'Junior Assistant',
  department       VARCHAR(80),
  age              TINYINT UNSIGNED,
  gender           ENUM('Male','Female','Other'),
  phone            VARCHAR(20),
  email            VARCHAR(100),
  experience       VARCHAR(40),
  rating           DECIMAL(3,1) DEFAULT 0.0,
  status           ENUM('Active','On Leave','Inactive') DEFAULT 'Active',
  avatar_url       VARCHAR(255),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS assistant_responsibilities (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  assistant_id   INT NOT NULL,
  responsibility VARCHAR(100) NOT NULL,
  FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE CASCADE
);

-- ============================================================
-- 5. ATTENDANCE (students, teachers, assistants)
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  entity_type    ENUM('student','teacher','assistant') NOT NULL,
  entity_id      INT NOT NULL,
  date           DATE NOT NULL,
  status         ENUM('Present','Absent','Late') NOT NULL DEFAULT 'Present',
  confirmed_by   INT,
  confirmed_at   DATETIME,
  UNIQUE KEY unique_attendance (entity_type, entity_id, date),
  FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 6. DAILY TOPICS (teacher submissions)
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_topics (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id    INT NOT NULL,
  subject       VARCHAR(80) NOT NULL,
  date          DATE NOT NULL,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  submitted_at  TIME,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- ============================================================
-- 7. TIMETABLE (5×5 grid: Mon–Fri × 8:00–12:00)
-- ============================================================
CREATE TABLE IF NOT EXISTS timetable (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  day_name    ENUM('Mon','Tue','Wed','Thu','Fri') NOT NULL,
  period      VARCHAR(10) NOT NULL,
  subject     VARCHAR(80),
  teacher_id  INT,
  grade       VARCHAR(10),
  class_name  VARCHAR(10),
  updated_by  INT,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_slot (day_name, period),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 8. TASKS  (manager assigns to teacher/assistant)
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  assigned_by    INT NOT NULL,
  assignee_type  ENUM('teacher','assistant') NOT NULL,
  assignee_id    INT NOT NULL,
  description    TEXT NOT NULL,
  due_date       DATE,
  status         ENUM('pending','in_progress','completed','overdue') DEFAULT 'pending',
  completed_at   DATETIME,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 9. SUBJECTS + STUDENT RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(80) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_results (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  student_id      INT NOT NULL,
  subject_id      INT NOT NULL,
  semester        ENUM('sem1','sem2') NOT NULL,
  assignment      TINYINT UNSIGNED DEFAULT 0,
  class_work      TINYINT UNSIGNED DEFAULT 0,
  mid_exam        TINYINT UNSIGNED DEFAULT 0,
  final_exam      TINYINT UNSIGNED DEFAULT 0,
  total           TINYINT UNSIGNED
    GENERATED ALWAYS AS (assignment + class_work + mid_exam + final_exam) STORED,
  grade_label     VARCHAR(4),
  submitted_by    INT,
  submitted_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_result (student_id, subject_id, semester),
  FOREIGN KEY (student_id)   REFERENCES students(id)  ON DELETE CASCADE,
  FOREIGN KEY (subject_id)   REFERENCES subjects(id)  ON DELETE CASCADE,
  FOREIGN KEY (submitted_by) REFERENCES users(id)     ON DELETE SET NULL
);

-- ============================================================
-- 10. PAYMENT STATUS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  is_paid     BOOLEAN NOT NULL DEFAULT FALSE,
  paid_date   DATE,
  term        VARCHAR(40),
  recorded_by INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)  REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id)    ON DELETE SET NULL
);

-- ============================================================
-- 11. ZAKAT RECORDS  (owner's Islamic zakat calculator)
-- ============================================================
CREATE TABLE IF NOT EXISTS zakat_records (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  annual_income DECIMAL(15,2) NOT NULL,
  nisab_value   DECIMAL(15,2) NOT NULL,
  zakat_amount  DECIMAL(15,2) NOT NULL,
  is_liable     BOOLEAN NOT NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 12. REPORTS (snapshot per term)
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  generated_by      INT,
  term              VARCHAR(40) NOT NULL,
  student_avg_score DECIMAL(5,2),
  teacher_task_rate DECIMAL(5,2),
  attendance_rate   DECIMAL(5,2),
  top_grade         VARCHAR(20),
  total_students    SMALLINT UNSIGNED,
  total_teachers    TINYINT UNSIGNED,
  total_assistants  TINYINT UNSIGNED,
  notes             TEXT,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 13. FILES  (manager sends file to teacher/assistant)
-- ============================================================
CREATE TABLE IF NOT EXISTS files (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  sent_by         INT NOT NULL,
  recipient_type  ENUM('teacher','assistant') NOT NULL,
  recipient_id    INT NOT NULL,
  file_name       VARCHAR(255) NOT NULL,
  file_size_kb    DECIMAL(10,2),
  message         TEXT,
  permission      ENUM('view','download') DEFAULT 'view',
  status          ENUM('pending','accepted','rejected') DEFAULT 'pending',
  responded_at    DATETIME,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 14. SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  key_name    VARCHAR(100) UNIQUE NOT NULL,
  value       TEXT,
  updated_by  INT,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Subjects
INSERT INTO subjects (name) VALUES
  ('Mathematics'),('Science'),('English'),('Arabic'),
  ('History'),('Physics'),('Chemistry'),('Biology')
ON DUPLICATE KEY UPDATE name = name;

-- Settings
INSERT INTO settings (key_name, value) VALUES
  ('school_name',           'Hidaya Islamic Academy'),
  ('school_year',           '2025-2026'),
  ('current_term',          'Term 1 2026'),
  ('nisab_value',           '595'),
  ('payment_amount_grade7', '1200'),
  ('payment_amount_grade8', '1500'),
  ('payment_amount_grade9', '1800')
ON DUPLICATE KEY UPDATE value = value;

-- ── Users — REAL bcrypt hashes (generated with bcryptjs cost=10) ────────────
-- !! Do NOT edit these hashes manually. Run: node db/seed.js to re-seed.
--
-- owner01 / owner123
INSERT INTO users (login_id, full_name, email, password, role, income) VALUES
  ('owner01','School Owner','owner@hidaya.edu',
   '$2a$10$.xxXtSP/qKSdDL5qAHuhK.7WNHxvZINY7tfQHda1sjk/MGFm.Tw4a','owner', 120000)
ON DUPLICATE KEY UPDATE password=VALUES(password), full_name=VALUES(full_name);

-- mgr01 / manager123
INSERT INTO users (login_id, full_name, email, password, role) VALUES
  ('mgr01','Mr. Hassan','manager@hidaya.edu',
   '$2a$10$hJXtgnVVVH7TSISirxcIeeh.NXbJh1sqE3C0F70f8WJhV/PDa65kK','manager')
ON DUPLICATE KEY UPDATE password=VALUES(password), full_name=VALUES(full_name);

-- a01 / pass01  (assistant)
INSERT INTO users (login_id, full_name, email, password, role) VALUES
  ('a01','Khalid Omar','khalid@hidaya.edu',
   '$2a$10$WJZvCjmWhi8.jwWMXA2KdeNHdvV2vl9MXSk3V9NlJu/ZuMqO.7dpS','assistant')
ON DUPLICATE KEY UPDATE password=VALUES(password), full_name=VALUES(full_name);

-- a02 / pass02  (assistant)
INSERT INTO users (login_id, full_name, email, password, role) VALUES
  ('a02','Noor Fatima','noor@hidaya.edu',
   '$2a$10$MxLNOC6.PrFNVlDwMFvQG.adTVoc3eM6JwfXjC/0Rwmdt4/Ty4v0K','assistant')
ON DUPLICATE KEY UPDATE password=VALUES(password), full_name=VALUES(full_name);

-- t01 / pass01  (teacher)
INSERT INTO users (login_id, full_name, email, password, role) VALUES
  ('t01','Mr. Ali','ali@hidaya.edu',
   '$2a$10$WJZvCjmWhi8.jwWMXA2KdeNHdvV2vl9MXSk3V9NlJu/ZuMqO.7dpS','teacher')
ON DUPLICATE KEY UPDATE password=VALUES(password), full_name=VALUES(full_name);

-- t02 / pass02
INSERT INTO users (login_id, full_name, email, password, role) VALUES
  ('t02','Ms. Sara','sara@hidaya.edu',
   '$2a$10$MxLNOC6.PrFNVlDwMFvQG.adTVoc3eM6JwfXjC/0Rwmdt4/Ty4v0K','teacher')
ON DUPLICATE KEY UPDATE password=VALUES(password), full_name=VALUES(full_name);

-- t03 / pass03
INSERT INTO users (login_id, full_name, email, password, role) VALUES
  ('t03','Mr. Omar','omar@hidaya.edu',
   '$2a$10$abHb0iLTsih/k.56Wu.bIuor34/cnrHwxu.Msq7tBfGAow5G23sXa','teacher')
ON DUPLICATE KEY UPDATE password=VALUES(password), full_name=VALUES(full_name);

-- t04 / pass04
INSERT INTO users (login_id, full_name, email, password, role) VALUES
  ('t04','Ms. Fatima','fatima@hidaya.edu',
   '$2a$10$nCPvYq0uEB9N95rOi5Uh4e9RwK7axgiSbcq8mSsITAFtvHdpab/Yy','teacher')
ON DUPLICATE KEY UPDATE password=VALUES(password), full_name=VALUES(full_name);
