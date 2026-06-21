const supabase = require('../db/supabase');

const gradeLabel = (total) => {
  if (total === null || total === undefined) return '—';
  if (total >= 90) return 'A+'; if (total >= 85) return 'A';
  if (total >= 80) return 'A-'; if (total >= 75) return 'B+';
  if (total >= 70) return 'B';  if (total >= 65) return 'B-';
  if (total >= 60) return 'C';  return 'F';
};

const getAllResults = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('student_results')
      .select('*, students(full_name, grade, student_code), subjects(name)')
      .order('semester');
    if (error) throw error;
    const result = data.map(r => ({
      ...r, student_name: r.students?.full_name, grade: r.students?.grade,
      student_code: r.students?.student_code, subject_name: r.subjects?.name,
      students: undefined, subjects: undefined
    }));
    return res.status(200).json({ success: true, data: result });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getStudentResults = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('student_results').select('*, subjects(name)').eq('student_id', req.params.studentId).order('semester');
    if (error) throw error;
    return res.status(200).json({ success: true, data: data.map(r => ({ ...r, subject_name: r.subjects?.name, subjects: undefined })) });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const saveResult = async (req, res) => {
  const { student_id, subject_id, semester, assignment, class_work, mid_exam, final_exam } = req.body;
  if (!student_id || !subject_id || !semester)
    return res.status(400).json({ success: false, message: 'student_id, subject_id, semester required.' });
  const a = Number(assignment||0), cw = Number(class_work||0), me = Number(mid_exam||0), fe = Number(final_exam||0);
  if (a > 10 || cw > 10 || me > 30 || fe > 50)
    return res.status(400).json({ success: false, message: 'Marks exceed allowed maximums (10/10/30/50).' });
  const gl = gradeLabel(a + cw + me + fe);
  try {
    // Delete existing then insert (upsert workaround for generated column)
    await supabase.from('student_results').delete()
      .eq('student_id', student_id).eq('subject_id', subject_id).eq('semester', semester);
    const { data, error } = await supabase.from('student_results')
      .insert({ student_id, subject_id, semester, assignment: a, class_work: cw, mid_exam: me, final_exam: fe, grade_label: gl, submitted_by: req.user.id })
      .select('*, subjects(name)').single();
    if (error) throw error;
    return res.status(200).json({ success: true, data: { ...data, subject_name: data.subjects?.name, subjects: undefined } });
  } catch (err) { console.error('SaveResult:', err); return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getSubjects = async (req, res) => {
  try {
    const { data, error } = await supabase.from('subjects').select('*').order('name');
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { getAllResults, getStudentResults, saveResult, getSubjects };
