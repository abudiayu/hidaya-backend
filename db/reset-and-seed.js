/**
 * Hidaya DB Reset + Seed
 * ─────────────────────────────────────────────────────────────
 * Run: node db/reset-and-seed.js
 *
 * ⚠️  Drops ALL existing tables and recreates them with the
 *     correct schema, then seeds all demo data.
 * Use this when the DB has the wrong/old schema.
 */
require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const cfg = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  database: process.env.DB_NAME     || 'hidayadb',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || 'root',
  multipleStatements: true,
};

async function run() {
  const conn = await mysql.createConnection(cfg);
  console.log('\n✅ Connected to', cfg.database);

  // ── DROP all tables in reverse FK order ─────────────────────────────────
  console.log('\n🗑️  Dropping old tables…');
  await conn.query(`SET FOREIGN_KEY_CHECKS = 0`);
  const [tables] = await conn.query(`SHOW TABLES`);
  for (const row of tables) {
    const tbl = Object.values(row)[0];
    await conn.query(`DROP TABLE IF EXISTS \`${tbl}\``);
    console.log(`   dropped: ${tbl}`);
  }
  await conn.query(`SET FOREIGN_KEY_CHECKS = 1`);

  // ── CREATE all tables ────────────────────────────────────────────────────
  console.log('\n🏗️  Creating tables…');

  await conn.query(`
    CREATE TABLE users (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      login_id   VARCHAR(20) UNIQUE NOT NULL,
      full_name  VARCHAR(100) NOT NULL,
      email      VARCHAR(100) UNIQUE,
      password   VARCHAR(255) NOT NULL,
      role       ENUM('owner','manager','assistant','teacher') NOT NULL DEFAULT 'teacher',
      income     DECIMAL(15,2) DEFAULT 0,
      avatar_url VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE students (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      student_code VARCHAR(10) UNIQUE NOT NULL,
      full_name    VARCHAR(100) NOT NULL,
      full_name_am VARCHAR(100),
      grade        VARCHAR(20) NOT NULL,
      age          TINYINT UNSIGNED,
      gender       ENUM('Male','Female','Other'),
      phone        VARCHAR(20),
      email        VARCHAR(100),
      avatar_url   VARCHAR(255),
      status       ENUM('Active','Inactive','Suspended') DEFAULT 'Active',
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE teachers (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      teacher_code  VARCHAR(10) UNIQUE NOT NULL,
      user_id       INT UNIQUE,
      full_name     VARCHAR(100) NOT NULL,
      subject       VARCHAR(80) NOT NULL,
      department    VARCHAR(80),
      branch        VARCHAR(80) DEFAULT 'Main Campus',
      age           TINYINT UNSIGNED,
      gender        ENUM('Male','Female','Other'),
      phone         VARCHAR(20),
      email         VARCHAR(100),
      experience    VARCHAR(40),
      rating        DECIMAL(3,1) DEFAULT 0.0,
      status        ENUM('Active','On Leave','Inactive') DEFAULT 'Active',
      avatar_url    VARCHAR(255),
      current_topic VARCHAR(200),
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE teacher_classes (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      teacher_id INT NOT NULL,
      class_name VARCHAR(30) NOT NULL,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE assistants (
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
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE assistant_responsibilities (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      assistant_id   INT NOT NULL,
      responsibility VARCHAR(100) NOT NULL,
      FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE attendance (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      entity_type ENUM('student','teacher','assistant') NOT NULL,
      entity_id   INT NOT NULL,
      date        DATE NOT NULL,
      status      ENUM('Present','Absent','Late') NOT NULL DEFAULT 'Present',
      confirmed_by INT,
      confirmed_at DATETIME,
      UNIQUE KEY unique_attendance (entity_type, entity_id, date),
      FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE daily_topics (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      teacher_id   INT NOT NULL,
      subject      VARCHAR(80) NOT NULL,
      date         DATE NOT NULL,
      title        VARCHAR(200) NOT NULL,
      description  TEXT,
      submitted_at TIME,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE timetable (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      day_name   ENUM('Mon','Tue','Wed','Thu','Fri') NOT NULL,
      period     VARCHAR(10) NOT NULL,
      subject    VARCHAR(80),
      teacher_id INT,
      grade      VARCHAR(10),
      class_name VARCHAR(10),
      updated_by INT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_slot (day_name, period),
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE tasks (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      assigned_by   INT NOT NULL,
      assignee_type ENUM('teacher','assistant') NOT NULL,
      assignee_id   INT NOT NULL,
      description   TEXT NOT NULL,
      due_date      DATE,
      status        ENUM('pending','in_progress','completed','overdue') DEFAULT 'pending',
      completed_at  DATETIME,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE subjects (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(80) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE student_results (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      student_id  INT NOT NULL,
      subject_id  INT NOT NULL,
      semester    ENUM('sem1','sem2') NOT NULL,
      assignment  TINYINT UNSIGNED DEFAULT 0,
      class_work  TINYINT UNSIGNED DEFAULT 0,
      mid_exam    TINYINT UNSIGNED DEFAULT 0,
      final_exam  TINYINT UNSIGNED DEFAULT 0,
      total       TINYINT UNSIGNED GENERATED ALWAYS AS (assignment + class_work + mid_exam + final_exam) STORED,
      grade_label VARCHAR(4),
      submitted_by INT,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_result (student_id, subject_id, semester),
      FOREIGN KEY (student_id)   REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id)   REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (submitted_by) REFERENCES users(id)    ON DELETE SET NULL
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE payments (
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
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE zakat_records (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      user_id       INT NOT NULL,
      annual_income DECIMAL(15,2) NOT NULL,
      nisab_value   DECIMAL(15,2) NOT NULL,
      zakat_amount  DECIMAL(15,2) NOT NULL,
      is_liable     BOOLEAN NOT NULL,
      calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE reports (
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
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE files (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      sent_by        INT NOT NULL,
      recipient_type ENUM('teacher','assistant') NOT NULL,
      recipient_id   INT NOT NULL,
      file_name      VARCHAR(255) NOT NULL,
      file_size_kb   DECIMAL(10,2),
      message        TEXT,
      permission     ENUM('view','download') DEFAULT 'view',
      status         ENUM('pending','accepted','rejected') DEFAULT 'pending',
      responded_at   DATETIME,
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE settings (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      key_name   VARCHAR(100) UNIQUE NOT NULL,
      value      TEXT,
      updated_by INT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  console.log('✅ All tables created\n');

  // ── SEED DATA ────────────────────────────────────────────────────────────
  const hash = (p) => bcrypt.hash(p, 10);

  // 1. USERS
  const users = [
    { login_id:'owner01', full_name:'School Owner', email:'owner@hidaya.edu',   pw: await hash('owner123'),   role:'owner',     income:120000 },
    { login_id:'mgr01',   full_name:'Mr. Hassan',   email:'manager@hidaya.edu', pw: await hash('manager123'), role:'manager',   income:0 },
    { login_id:'a01',     full_name:'Khalid Omar',  email:'khalid@hidaya.edu',  pw: await hash('pass01'),     role:'assistant', income:0 },
    { login_id:'a02',     full_name:'Noor Fatima',  email:'noor@hidaya.edu',    pw: await hash('pass02'),     role:'assistant', income:0 },
    { login_id:'t01',     full_name:'Mr. Ali',      email:'ali@hidaya.edu',     pw: await hash('pass01'),     role:'teacher',   income:0 },
    { login_id:'t02',     full_name:'Ms. Sara',     email:'sara@hidaya.edu',    pw: await hash('pass02'),     role:'teacher',   income:0 },
    { login_id:'t03',     full_name:'Mr. Omar',     email:'omar@hidaya.edu',    pw: await hash('pass03'),     role:'teacher',   income:0 },
    { login_id:'t04',     full_name:'Ms. Fatima',   email:'fatima@hidaya.edu',  pw: await hash('pass04'),     role:'teacher',   income:0 },
  ];
  for (const u of users) {
    await conn.query(
      'INSERT INTO users (login_id,full_name,email,password,role,income) VALUES (?,?,?,?,?,?)',
      [u.login_id, u.full_name, u.email, u.pw, u.role, u.income]
    );
  }
  console.log('✅ Users seeded');

  // User ID map
  const [uRows] = await conn.query('SELECT id, login_id FROM users');
  const uid = {};
  uRows.forEach(r => { uid[r.login_id] = r.id; });

  // 2. SETTINGS
  const settings = [
    ['school_name','Hidaya Islamic Academy'],['school_year','2025-2026'],
    ['current_term','Term 1 2026'],['nisab_value','595'],
    ['payment_amount_grade7','1200'],['payment_amount_grade8','1500'],
    ['payment_amount_grade9','1800'],
  ];
  for (const [k,v] of settings) await conn.query('INSERT INTO settings (key_name,value) VALUES (?,?)', [k,v]);
  console.log('✅ Settings seeded');

  // 3. SUBJECTS
  for (const n of ['Mathematics','Science','English','Arabic','History','Physics','Chemistry','Biology'])
    await conn.query('INSERT INTO subjects (name) VALUES (?)', [n]);
  console.log('✅ Subjects seeded');

  // 4. TEACHERS
  const teachers = [
    { code:'T001', user:'t01', name:'Mr. Ali',    subj:'Mathematics', dept:'Mathematics', branch:'Main Campus',  age:34, gender:'Male',   phone:'+251555-0201', email:'ali@hidaya.edu',    exp:'8 years',  rating:4.7, status:'Active',   topic:'Quadratic Equations — Chapter 5',   cls:['Grade 7A','Grade 8B','Grade 9A'] },
    { code:'T002', user:'t02', name:'Ms. Sara',   subj:'Science',     dept:'Sciences',    branch:'Main Campus',  age:29, gender:'Female', phone:'+251555-0202', email:'sara@hidaya.edu',   exp:'5 years',  rating:4.9, status:'Active',   topic:'Cell Division — Mitosis & Meiosis', cls:['Grade 8A','Grade 9B'] },
    { code:'T003', user:'t03', name:'Mr. Omar',   subj:'English',     dept:'Languages',   branch:'North Branch', age:41, gender:'Male',   phone:'+251555-0203', email:'omar@hidaya.edu',   exp:'14 years', rating:3.8, status:'On Leave', topic:'Essay Writing — Argumentative Style',cls:['Grade 7B','Grade 8A'] },
    { code:'T004', user:'t04', name:'Ms. Fatima', subj:'History',     dept:'Humanities',  branch:'Main Campus',  age:36, gender:'Female', phone:'+251555-0204', email:'fatima@hidaya.edu', exp:'9 years',  rating:4.6, status:'Active',   topic:'The Ottoman Empire — Rise and Fall', cls:['Grade 9A','Grade 9B'] },
  ];
  for (const t of teachers) {
    const [r] = await conn.query(
      'INSERT INTO teachers (teacher_code,user_id,full_name,subject,department,branch,age,gender,phone,email,experience,rating,status,current_topic) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [t.code,uid[t.user],t.name,t.subj,t.dept,t.branch,t.age,t.gender,t.phone,t.email,t.exp,t.rating,t.status,t.topic]
    );
    const tid = r.insertId;
    for (const c of t.cls) await conn.query('INSERT INTO teacher_classes (teacher_id,class_name) VALUES (?,?)', [tid,c]);
  }
  console.log('✅ Teachers seeded');

  // 5. ASSISTANTS
  const assistants = [
    { code:'A001', user:'a01', name:'Khalid Omar', rtitle:'Senior Assistant', dept:'Academic Affairs', age:27, gender:'Male',   phone:'+251555-0301', email:'khalid.omar@hidaya.edu', exp:'4 years', rating:4.5, status:'Active',
      resp:['Teacher Monitoring','Timetable Management','Task Coordination','Report Compilation'] },
    { code:'A002', user:'a02', name:'Noor Fatima',  rtitle:'Junior Assistant', dept:'Student Affairs',  age:23, gender:'Female', phone:'+251555-0302', email:'noor.fatima@hidaya.edu',  exp:'1 year',  rating:4.8, status:'Active',
      resp:['Student Records','Attendance Tracking','Parent Communication','Event Coordination'] },
  ];
  for (const a of assistants) {
    const [r] = await conn.query(
      'INSERT INTO assistants (assistant_code,user_id,full_name,role_title,department,age,gender,phone,email,experience,rating,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [a.code,uid[a.user],a.name,a.rtitle,a.dept,a.age,a.gender,a.phone,a.email,a.exp,a.rating,a.status]
    );
    const aid = r.insertId;
    for (const resp of a.resp) await conn.query('INSERT INTO assistant_responsibilities (assistant_id,responsibility) VALUES (?,?)', [aid,resp]);
  }
  console.log('✅ Assistants seeded');

  // 6. STUDENTS
  const students = [
    ['S001','Ali Hassan','አሊ ሃሰን','Grade 8',14,'Male','+251911001001','ali.hassan@hidaya.edu'],
    ['S002','Sara Ahmed','ሳራ አህመድ','Grade 8',13,'Female','+251911001002','sara.ahmed@hidaya.edu'],
    ['S003','Omar Khalid','ዑመር ካሊድ','Grade 9',15,'Male','+251911001003','omar.khalid@hidaya.edu'],
    ['S004','Fatima Noor','ፋጢማ ኑር','Grade 9',15,'Female','+251911001004','fatima.noor@hidaya.edu'],
    ['S005','Yusuf Ibrahim','ዩሱፍ ኢብራሂም','Grade 7',12,'Male','+251911001005','yusuf.ibrahim@hidaya.edu'],
    ['S006','Amina Tesfaye','አሚና ተስፋዬ','Grade 8',14,'Female','+251911001006','amina.tesfaye@hidaya.edu'],
    ['S007','Bilal Mohammed','ቢላል መሐመድ','Grade 7',13,'Male','+251911001007','bilal.m@hidaya.edu'],
    ['S008','Hana Bekele','ሃና በቀለ','Grade 8',14,'Female','+251911001008','hana.bekele@hidaya.edu'],
    ['S009','Dawit Alemu','ዳዊት አለሙ','Grade 9',15,'Male','+251911001009','dawit.alemu@hidaya.edu'],
    ['S010','Meron Abate','ሜሮን አባተ','Grade 8',13,'Female','+251911001010','meron.abate@hidaya.edu'],
  ];
  for (const s of students) {
    await conn.query(
      'INSERT INTO students (student_code,full_name,full_name_am,grade,age,gender,phone,email,status) VALUES (?,?,?,?,?,?,?,?,?)',
      [...s, 'Active']
    );
  }
  console.log('✅ Students seeded');

  // 7. PAYMENTS
  const amtMap = { 'Grade 7':1200, 'Grade 8':1500, 'Grade 9':1800 };
  const [sRows] = await conn.query('SELECT id,grade FROM students');
  const paidArr = [true,false,true,false,true,true,false,true,false,true];
  for (let i = 0; i < sRows.length; i++) {
    const paid = paidArr[i];
    await conn.query(
      'INSERT INTO payments (student_id,amount,is_paid,paid_date,term,recorded_by) VALUES (?,?,?,?,?,?)',
      [sRows[i].id, amtMap[sRows[i].grade]||1500, paid?1:0, paid?'2026-01-10':null, 'Term 1 2026', uid['mgr01']]
    );
  }
  console.log('✅ Payments seeded');

  // 8. TASKS
  const [tRows] = await conn.query('SELECT id FROM teachers ORDER BY id LIMIT 4');
  const taskData = [
    ['Submit weekly report','completed'],
    ['Update student records','pending'],
    ['Confirm attendance logs','pending'],
    ['Prepare term assessment','in_progress'],
  ];
  for (let i = 0; i < tRows.length; i++) {
    await conn.query(
      'INSERT INTO tasks (assigned_by,assignee_type,assignee_id,description,due_date,status) VALUES (?,?,?,?,?,?)',
      [uid['mgr01'],'teacher',tRows[i].id,taskData[i][0],'2026-07-01',taskData[i][1]]
    );
  }
  console.log('✅ Tasks seeded');

  // 9. TIMETABLE
  const days    = ['Mon','Tue','Wed','Thu','Fri'];
  const periods = ['8:00','9:00','10:00','11:00','12:00'];
  const subjs   = ['Mathematics','Science','English','History','Arabic'];
  const [trRows] = await conn.query('SELECT id FROM teachers ORDER BY id LIMIT 4');
  for (let di = 0; di < days.length; di++) {
    for (let pi = 0; pi < periods.length; pi++) {
      const tid = trRows[(di+pi) % trRows.length].id;
      await conn.query(
        'INSERT INTO timetable (day_name,period,subject,teacher_id,grade,class_name,updated_by) VALUES (?,?,?,?,?,?,?)',
        [days[di],periods[pi],subjs[(di+pi)%subjs.length],tid,String((di%3)+7),['A','B','C'][pi%3],uid['a01']]
      );
    }
  }
  console.log('✅ Timetable seeded');

  // 10. STUDENT RESULTS
  const [subRows] = await conn.query('SELECT id FROM subjects LIMIT 6');
  const [stuRows] = await conn.query('SELECT id FROM students');
  for (const stu of stuRows) {
    for (const sub of subRows) {
      for (const sem of ['sem1','sem2']) {
        const a=Math.floor(Math.random()*3)+8, cw=Math.floor(Math.random()*3)+8;
        const me=Math.floor(Math.random()*8)+22, fe=Math.floor(Math.random()*12)+38;
        await conn.query(
          'INSERT INTO student_results (student_id,subject_id,semester,assignment,class_work,mid_exam,final_exam,grade_label,submitted_by) VALUES (?,?,?,?,?,?,?,?,?)',
          [stu.id,sub.id,sem,a,cw,me,fe,'A',uid['t01']]
        );
      }
    }
  }
  console.log('✅ Student results seeded');

  // 11. DAILY TOPICS
  const [tDbRows] = await conn.query('SELECT id,subject FROM teachers LIMIT 4');
  const topicArr = [
    ['Quadratic Equations','Introduced the quadratic formula and worked through examples.'],
    ['Cell Division — Mitosis','Explained the 4 phases of mitosis with diagrams.'],
    ['Argumentative Essay','Introduced the structure of argumentative writing.'],
    ['Ottoman Empire Rise','Discussed the founding of the Ottoman Empire.'],
  ];
  for (let i = 0; i < tDbRows.length; i++) {
    await conn.query(
      "INSERT INTO daily_topics (teacher_id,subject,date,title,description,submitted_at) VALUES (?,?,CURDATE(),?,?,'08:45:00')",
      [tDbRows[i].id,tDbRows[i].subject,topicArr[i][0],topicArr[i][1]]
    );
  }
  console.log('✅ Daily topics seeded');

  await conn.end();

  console.log('\n🎉 Database fully reset and seeded!\n');
  console.log('📋 Login credentials:');
  console.log('   owner01   / owner123');
  console.log('   mgr01     / manager123');
  console.log('   a01       / pass01');
  console.log('   a02       / pass02');
  console.log('   t01       / pass01');
  console.log('   t02       / pass02');
  console.log('   t03       / pass03');
  console.log('   t04       / pass04\n');
}

run().catch(e => {
  console.error('\n❌ Reset failed:', e.message);
  console.error(e);
  process.exit(1);
});
