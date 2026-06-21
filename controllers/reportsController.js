const supabase = require('../db/supabase');

// ── helpers ───────────────────────────────────────────────────────────────────
const avg = (arr) => arr.length ? arr.reduce((s, v) => s + Number(v), 0) / arr.length : 0;
const pct = (num, den) => den > 0 ? +((num / den) * 100).toFixed(1) : 0;

const getLiveStats = async () => {
  const [results, tasks, attendance, students, teachers, assistants, payments] = await Promise.all([
    supabase.from('student_results').select('total').not('total', 'is', null),
    supabase.from('tasks').select('status').eq('assignee_type', 'teacher'),
    supabase.from('attendance').select('status'),
    supabase.from('students').select('id, grade').eq('status', 'Active'),
    supabase.from('teachers').select('id').eq('status', 'Active'),
    supabase.from('assistants').select('id').eq('status', 'Active'),
    supabase.from('payments').select('is_paid, amount'),
  ]);
  const totals = (results.data||[]).map(r => Number(r.total));
  const student_avg_score = totals.length ? +avg(totals).toFixed(1) : 0;
  const tArr = tasks.data||[];
  const teacher_task_rate = pct(tArr.filter(t => t.status === 'completed').length, tArr.length);
  const aArr = attendance.data||[];
  const attendance_rate   = pct(aArr.filter(a => a.status === 'Present').length, aArr.length);
  // top grade
  const gradeAvg = {};
  for (const r of results.data||[]) {/* need to join — done separately */}
  const { data: gradeData } = await supabase.from('student_results').select('total, students(grade)').not('total','is',null);
  const gMap = {};
  for (const r of gradeData||[]) {
    const g = r.students?.grade; if (!g) continue;
    if (!gMap[g]) gMap[g] = []; gMap[g].push(Number(r.total));
  }
  let top_grade = 'N/A', topAvg = -1;
  for (const [g, vals] of Object.entries(gMap)) { const a = avg(vals); if (a > topAvg) { topAvg = a; top_grade = g; } }
  const pArr = payments.data||[];
  const collected = pArr.filter(p => p.is_paid).reduce((s, p) => s + Number(p.amount), 0);
  return {
    student_avg_score, teacher_task_rate, attendance_rate, top_grade,
    total_students: (students.data||[]).length,
    total_teachers:  (teachers.data||[]).length,
    total_assistants:(assistants.data||[]).length,
    total_payments:  pArr.length,
    paid_count:      pArr.filter(p=>p.is_paid).length,
    unpaid_count:    pArr.filter(p=>!p.is_paid).length,
    collected,
  };
};

const getReportsOverview = async (req, res) => {
  try { return res.status(200).json({ success: true, data: await getLiveStats() }); }
  catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getTeacherTaskStats = async (req, res) => {
  try {
    const { data: teachers } = await supabase.from('teachers').select('id, full_name, teacher_code').order('full_name');
    const result = await Promise.all((teachers||[]).map(async t => {
      const { data: tasks } = await supabase.from('tasks').select('status').eq('assignee_type','teacher').eq('assignee_id', t.id);
      const total = tasks?.length || 0;
      const done  = tasks?.filter(x => x.status==='completed').length || 0;
      return { ...t, total_tasks: total, done_tasks: done, completion_pct: pct(done, total) };
    }));
    return res.status(200).json({ success: true, data: result });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getGradeDistribution = async (req, res) => {
  try {
    const { data } = await supabase.from('students').select('grade').eq('status','Active');
    const counts = {};
    for (const s of data||[]) { counts[s.grade] = (counts[s.grade]||0) + 1; }
    const result = Object.entries(counts).map(([grade, count]) => ({ grade, count })).sort((a,b) => a.grade.localeCompare(b.grade));
    return res.status(200).json({ success: true, data: result });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getAttendanceBreakdown = async (req, res) => {
  try {
    const { data } = await supabase.from('attendance').select('entity_type, status');
    const map = {};
    for (const r of data||[]) {
      if (!map[r.entity_type]) map[r.entity_type] = { total:0, present:0 };
      map[r.entity_type].total++;
      if (r.status === 'Present') map[r.entity_type].present++;
    }
    const result = Object.entries(map).map(([entity_type, v]) => ({ entity_type, pct: pct(v.present, v.total) }));
    return res.status(200).json({ success: true, data: result });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const generateReport = async (req, res) => {
  const { term, notes, comment, document_name, document_data, document_type } = req.body;
  if (!term) return res.status(400).json({ success: false, message: 'term is required.' });
  try {
    const stats = await getLiveStats();
    let docBuffer = null;
    if (document_data) {
      const base64 = document_data.includes(',') ? document_data.split(',')[1] : document_data;
      docBuffer = Buffer.from(base64, 'base64').toString('base64'); // store as base64 text in Supabase
    }
    const { data, error } = await supabase.from('reports').insert({
      generated_by: req.user.id, term,
      student_avg_score: stats.student_avg_score, teacher_task_rate: stats.teacher_task_rate,
      attendance_rate: stats.attendance_rate, top_grade: stats.top_grade,
      total_students: stats.total_students, total_teachers: stats.total_teachers, total_assistants: stats.total_assistants,
      notes: notes||null, comment: comment||null,
      document_name: document_name||null, document_data: docBuffer, document_type: document_type||null,
      status: 'draft'
    }).select('id, term, student_avg_score, teacher_task_rate, attendance_rate, top_grade, total_students, total_teachers, total_assistants, notes, comment, document_name, document_type, status, sent_at, created_at, generated_by').single();
    if (error) throw error;
    const { data: user } = await supabase.from('users').select('full_name').eq('id', req.user.id).single();
    return res.status(201).json({ success: true, data: { ...data, generated_by_name: user?.full_name } });
  } catch (err) { console.error('GenerateReport:', err); return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const sendReport = async (req, res) => {
  try {
    const { data, error } = await supabase.from('reports')
      .update({ status: 'sent', sent_at: new Date().toISOString(), sent_by: req.user.id })
      .eq('id', req.params.id)
      .select('id, term, student_avg_score, teacher_task_rate, attendance_rate, top_grade, total_students, total_teachers, total_assistants, notes, comment, document_name, document_type, status, sent_at, created_at, generated_by').single();
    if (error) return res.status(404).json({ success: false, message: 'Report not found.' });
    const { data: user } = await supabase.from('users').select('full_name').eq('id', data.generated_by).single();
    return res.status(200).json({ success: true, data: { ...data, generated_by_name: user?.full_name } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getReportsList = async (req, res) => {
  try {
    const { data, error } = await supabase.from('reports')
      .select('id, term, student_avg_score, teacher_task_rate, attendance_rate, top_grade, total_students, total_teachers, total_assistants, notes, comment, document_name, document_type, status, sent_at, created_at, users!generated_by(full_name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.status(200).json({ success: true, data: data.map(r => ({ ...r, generated_by_name: r.users?.full_name, users: undefined })) });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getSentReports = async (req, res) => {
  try {
    const { data, error } = await supabase.from('reports')
      .select('id, term, student_avg_score, teacher_task_rate, attendance_rate, top_grade, total_students, total_teachers, total_assistants, notes, comment, document_name, document_type, status, sent_at, created_at, users!generated_by(full_name)')
      .eq('status', 'sent').order('sent_at', { ascending: false });
    if (error) throw error;
    return res.status(200).json({ success: true, data: data.map(r => ({ ...r, generated_by_name: r.users?.full_name, users: undefined })) });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const downloadDocument = async (req, res) => {
  try {
    const { data, error } = await supabase.from('reports')
      .select('document_name, document_data, document_type').eq('id', req.params.id).single();
    if (error || !data?.document_data) return res.status(404).json({ success: false, message: 'No document attached.' });
    const buf = Buffer.from(data.document_data, 'base64');
    res.setHeader('Content-Disposition', `attachment; filename="${data.document_name || 'report'}"`);
    res.setHeader('Content-Type', data.document_type || 'application/octet-stream');
    res.send(buf);
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const deleteReport = async (req, res) => {
  try {
    const { error } = await supabase.from('reports').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.status(200).json({ success: true, data: { message: 'Report deleted.' } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { getReportsOverview, getTeacherTaskStats, getGradeDistribution, getAttendanceBreakdown, generateReport, sendReport, getReportsList, getSentReports, downloadDocument, deleteReport };
