/**
 * Hidaya Supabase Seed Script
 * Run: node db/seed.js
 * Seeds all demo data with real bcrypt passwords.
 */
require('dotenv').config();
const bcrypt   = require('bcryptjs');
const supabase = require('./supabase');

async function seed() {
  console.log('\n🌱 Seeding Hidaya database (Supabase)…\n');
  const hash = (p) => bcrypt.hash(p, 10);

  // ── USERS ──────────────────────────────────────────────────────────────────
  const users = [
    { login_id:'owner01', full_name:'School Owner', email:'owner@hidaya.edu',   password: await hash('owner123'),   role:'owner',     income:120000 },
    { login_id:'mgr01',   full_name:'Mr. Hassan',   email:'manager@hidaya.edu', password: await hash('manager123'), role:'manager' },
    { login_id:'a01',     full_name:'Khalid Omar',  email:'khalid@hidaya.edu',  password: await hash('pass01'),     role:'assistant' },
    { login_id:'a02',     full_name:'Noor Fatima',  email:'noor@hidaya.edu',    password: await hash('pass02'),     role:'assistant' },
    { login_id:'t01',     full_name:'Mr. Ali',      email:'ali@hidaya.edu',     password: await hash('pass01'),     role:'teacher' },
    { login_id:'t02',     full_name:'Ms. Sara',     email:'sara@hidaya.edu',    password: await hash('pass02'),     role:'teacher' },
    { login_id:'t03',     full_name:'Mr. Omar',     email:'omar@hidaya.edu',    password: await hash('pass03'),     role:'teacher' },
    { login_id:'t04',     full_name:'Ms. Fatima',   email:'fatima@hidaya.edu',  password: await hash('pass04'),     role:'teacher' },
  ];

  for (const u of users) {
    const { error } = await supabase.from('users').upsert(u, { onConflict: 'login_id' });
    if (error) console.error('User upsert error:', u.login_id, error.message);
  }
  console.log('✅ Users seeded');

  // Get user IDs
  const { data: uRows } = await supabase.from('users').select('id, login_id');
  const uid = {};
  uRows.forEach(r => { uid[r.login_id] = r.id; });

  // ── SETTINGS ───────────────────────────────────────────────────────────────
  const settings = [
    { key_name:'school_name', value:'Hidaya Islamic Academy' },
    { key_name:'school_year', value:'2025-2026' },
    { key_name:'current_term', value:'Term 1 2026' },
    { key_name:'nisab_value', value:'595' },
    { key_name:'payment_amount_grade7', value:'1200' },
    { key_name:'payment_amount_grade8', value:'1500' },
    { key_name:'payment_amount_grade9', value:'1800' },
  ];
  for (const s of settings) {
    await supabase.from('settings').upsert(s, { onConflict: 'key_name' });
  }
  console.log('✅ Settings seeded');

  // ── SUBJECTS ────────────────────────────────────────────────────────────────
  for (const name of ['Mathematics','Science','English','Arabic','History','Physics','Chemistry','Biology']) {
    await supabase.from('subjects').upsert({ name }, { onConflict: 'name' });
  }
  console.log('✅ Subjects seeded');

  // ── TEACHERS ────────────────────────────────────────────────────────────────
  const teachers = [
    { code:'T001', user:'t01', name:'Mr. Ali',    subject:'Mathematics', dept:'Mathematics', branch:'Main Campus',  age:34, gender:'Male',   phone:'+251555-0201', email:'ali@hidaya.edu',    exp:'8 years',  rating:4.7, status:'Active',   topic:'Quadratic Equations — Chapter 5',   classes:['Grade 7A','Grade 8B','Grade 9A'] },
    { code:'T002', user:'t02', name:'Ms. Sara',   subject:'Science',     dept:'Sciences',    branch:'Main Campus',  age:29, gender:'Female', phone:'+251555-0202', email:'sara@hidaya.edu',   exp:'5 years',  rating:4.9, status:'Active',   topic:'Cell Division — Mitosis & Meiosis', classes:['Grade 8A','Grade 9B'] },
    { code:'T003', user:'t03', name:'Mr. Omar',   subject:'English',     dept:'Languages',   branch:'North Branch', age:41, gender:'Male',   phone:'+251555-0203', email:'omar@hidaya.edu',   exp:'14 years', rating:3.8, status:'On Leave', topic:'Essay Writing — Argumentative Style',classes:['Grade 7B','Grade 8A'] },
    { code:'T004', user:'t04', name:'Ms. Fatima', subject:'History',     dept:'Humanities',  branch:'Main Campus',  age:36, gender:'Female', phone:'+251555-0204', email:'fatima@hidaya.edu', exp:'9 years',  rating:4.6, status:'Active',   topic:'The Ottoman Empire — Rise and Fall', classes:['Grade 9A','Grade 9B'] },
  ];
  for (const t of teachers) {
    const { data: td } = await supabase.from('teachers').upsert({ teacher_code:t.code, user_id:uid[t.user]||null, full_name:t.name, subject:t.subject, department:t.dept, branch:t.branch, age:t.age, gender:t.gender, phone:t.phone, email:t.email, experience:t.exp, rating:t.rating, status:t.status, current_topic:t.topic }, { onConflict:'teacher_code' }).select('id').single();
    const tid = td?.id;
    if (tid) {
      await supabase.from('teacher_classes').delete().eq('teacher_id', tid);
      for (const cls of t.classes) await supabase.from('teacher_classes').insert({ teacher_id: tid, class_name: cls });
    }
  }
  console.log('✅ Teachers seeded');

  // ── ASSISTANTS ──────────────────────────────────────────────────────────────
  const assistants = [
    { code:'A001', user:'a01', name:'Khalid Omar', title:'Senior Assistant', dept:'Academic Affairs', age:27, gender:'Male',   phone:'+251555-0301', email:'khalid.omar@hidaya.edu', exp:'4 years', rating:4.5, status:'Active', resp:['Teacher Monitoring','Timetable Management','Task Coordination','Report Compilation'] },
    { code:'A002', user:'a02', name:'Noor Fatima', title:'Junior Assistant', dept:'Student Affairs',  age:23, gender:'Female', phone:'+251555-0302', email:'noor.fatima@hidaya.edu',  exp:'1 year',  rating:4.8, status:'Active', resp:['Student Records','Attendance Tracking','Parent Communication','Event Coordination'] },
  ];
  for (const a of assistants) {
    const { data: ad } = await supabase.from('assistants').upsert({ assistant_code:a.code, user_id:uid[a.user]||null, full_name:a.name, role_title:a.title, department:a.dept, age:a.age, gender:a.gender, phone:a.phone, email:a.email, experience:a.exp, rating:a.rating, status:a.status }, { onConflict:'assistant_code' }).select('id').single();
    const aid = ad?.id;
    if (aid) {
      await supabase.from('assistant_responsibilities').delete().eq('assistant_id', aid);
      for (const resp of a.resp) await supabase.from('assistant_responsibilities').insert({ assistant_id: aid, responsibility: resp });
    }
  }
  console.log('✅ Assistants seeded');

  // ── STUDENTS ────────────────────────────────────────────────────────────────
  const students = [
    { code:'S001', name:'Ali Hassan',     am:'አሊ ሃሰን',      grade:'Grade 8', age:14, gender:'Male',   phone:'+251911001001', email:'ali.hassan@hidaya.edu' },
    { code:'S002', name:'Sara Ahmed',     am:'ሳራ አህመድ',     grade:'Grade 8', age:13, gender:'Female', phone:'+251911001002', email:'sara.ahmed@hidaya.edu' },
    { code:'S003', name:'Omar Khalid',    am:'ዑመር ካሊድ',    grade:'Grade 9', age:15, gender:'Male',   phone:'+251911001003', email:'omar.khalid@hidaya.edu' },
    { code:'S004', name:'Fatima Noor',    am:'ፋጢማ ኑር',     grade:'Grade 9', age:15, gender:'Female', phone:'+251911001004', email:'fatima.noor@hidaya.edu' },
    { code:'S005', name:'Yusuf Ibrahim',  am:'ዩሱፍ ኢብራሂም',  grade:'Grade 7', age:12, gender:'Male',   phone:'+251911001005', email:'yusuf.ibrahim@hidaya.edu' },
    { code:'S006', name:'Amina Tesfaye',  am:'አሚና ተስፋዬ',    grade:'Grade 8', age:14, gender:'Female', phone:'+251911001006', email:'amina.tesfaye@hidaya.edu' },
    { code:'S007', name:'Bilal Mohammed', am:'ቢላል መሐመድ',   grade:'Grade 7', age:13, gender:'Male',   phone:'+251911001007', email:'bilal.m@hidaya.edu' },
    { code:'S008', name:'Hana Bekele',    am:'ሃና በቀለ',      grade:'Grade 8', age:14, gender:'Female', phone:'+251911001008', email:'hana.bekele@hidaya.edu' },
    { code:'S009', name:'Dawit Alemu',    am:'ዳዊት አለሙ',    grade:'Grade 9', age:15, gender:'Male',   phone:'+251911001009', email:'dawit.alemu@hidaya.edu' },
    { code:'S010', name:'Meron Abate',    am:'ሜሮን አባተ',     grade:'Grade 8', age:13, gender:'Female', phone:'+251911001010', email:'meron.abate@hidaya.edu' },
  ];
  for (const s of students) {
    await supabase.from('students').upsert({ student_code:s.code, full_name:s.name, full_name_am:s.am, grade:s.grade, age:s.age, gender:s.gender, phone:s.phone, email:s.email, status:'Active' }, { onConflict:'student_code' });
  }
  console.log('✅ Students seeded');

  // ── PAYMENTS ────────────────────────────────────────────────────────────────
  const amtMap = { 'Grade 7':1200, 'Grade 8':1500, 'Grade 9':1800 };
  const { data: sRows } = await supabase.from('students').select('id, grade');
  const paidFlags = [true,false,true,false,true,true,false,true,false,true];
  const { data: existingPay } = await supabase.from('payments').select('student_id');
  const existingIds = new Set((existingPay||[]).map(p => p.student_id));
  for (let i = 0; i < sRows.length; i++) {
    if (existingIds.has(sRows[i].id)) continue;
    const paid = paidFlags[i % paidFlags.length];
    await supabase.from('payments').insert({ student_id:sRows[i].id, amount:amtMap[sRows[i].grade]||1500, is_paid:paid, paid_date:paid?'2026-01-10':null, term:'Term 1 2026', recorded_by:uid['mgr01']||null });
  }
  console.log('✅ Payments seeded');

  // ── TASKS ────────────────────────────────────────────────────────────────────
  const { data: tRows } = await supabase.from('teachers').select('id').limit(4);
  const { data: existTasks } = await supabase.from('tasks').select('id').limit(1);
  if (!existTasks?.length) {
    const taskData = [['Submit weekly report','completed'],['Update student records','pending'],['Confirm attendance logs','pending'],['Prepare term assessment','in_progress']];
    for (let i = 0; i < tRows.length; i++) {
      await supabase.from('tasks').insert({ assigned_by:uid['mgr01']||1, assignee_type:'teacher', assignee_id:tRows[i].id, description:taskData[i][0], due_date:'2026-07-01', status:taskData[i][1] });
    }
  }
  console.log('✅ Tasks seeded');

  // ── TIMETABLE ────────────────────────────────────────────────────────────────
  const days=['Mon','Tue','Wed','Thu','Fri'], periods=['8:00','9:00','10:00','11:00','12:00'], subjs=['Mathematics','Science','English','History','Arabic'];
  const { data: trRows } = await supabase.from('teachers').select('id').limit(4);
  for (let di=0; di<days.length; di++) {
    for (let pi=0; pi<periods.length; pi++) {
      const tid = trRows[(di+pi)%trRows.length]?.id||null;
      await supabase.from('timetable').upsert({ day_name:days[di], period:periods[pi], subject:subjs[(di+pi)%subjs.length], teacher_id:tid, grade:String((di%3)+7), class_name:['A','B','C'][pi%3], updated_by:uid['a01']||null }, { onConflict:'day_name,period' });
    }
  }
  console.log('✅ Timetable seeded');

  // ── SPONSORSHIPS ─────────────────────────────────────────────────────────────
  const { data: existSpon } = await supabase.from('sponsorships').select('id').limit(1);
  if (!existSpon?.length) {
    await supabase.from('sponsorships').insert([
      { donor_name:'Ahmed Al-Rashidi Foundation', amount:15000, description:'Annual educational grant', received_date:'2026-01-01', status:'received' },
      { donor_name:'Hidaya Community Fund', amount:8500, description:'Term 1 community support', received_date:'2026-02-15', status:'received' },
      { donor_name:'Anonymous Donor', amount:5000, description:'General school support', received_date:'2026-03-10', status:'received' },
    ]);
  }
  console.log('✅ Sponsorships seeded');

  console.log('\n🎉 All seed data inserted!\n');
  console.log('📋 Credentials: owner01/owner123 · mgr01/manager123 · t01-t04/pass01-pass04 · a01-a02/pass01-pass02\n');
  process.exit(0);
}

seed().catch(e => { console.error('\n❌ Seed failed:', e.message); process.exit(1); });
