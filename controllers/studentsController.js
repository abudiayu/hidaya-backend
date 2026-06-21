const supabase = require('../db/supabase');

const getAllStudents = async (req, res) => {
  try {
    const { data, error } = await supabase.from('students').select('*').order('grade').order('full_name');
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('GetAllStudents:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { data, error } = await supabase.from('students').select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, message: 'Student not found.' });
    const { data: results } = await supabase
      .from('student_results').select('*, subjects(name)').eq('student_id', req.params.id).order('semester');
    return res.status(200).json({ success: true, data: { ...data, results: results || [] } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createStudent = async (req, res) => {
  const { student_code, full_name, full_name_am, grade, age, gender, phone, email, avatar_url, status } = req.body;
  if (!student_code || !full_name || !grade)
    return res.status(400).json({ success: false, message: 'student_code, full_name, and grade are required.' });
  try {
    const { data: dup } = await supabase.from('students').select('id').eq('student_code', student_code).limit(1);
    if (dup?.length) return res.status(409).json({ success: false, message: 'Student code already exists.' });

    const { data, error } = await supabase.from('students')
      .insert({ student_code, full_name, full_name_am: full_name_am||null, grade, age: age||null, gender: gender||null, phone: phone||null, email: email||null, avatar_url: avatar_url||null, status: status||'Active' })
      .select().single();
    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('CreateStudent:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateStudent = async (req, res) => {
  const { full_name, full_name_am, grade, age, gender, phone, email, avatar_url, status } = req.body;
  try {
    const updates = {};
    if (full_name    !== undefined) updates.full_name    = full_name;
    if (full_name_am !== undefined) updates.full_name_am = full_name_am;
    if (grade        !== undefined) updates.grade        = grade;
    if (age          !== undefined) updates.age          = age;
    if (gender       !== undefined) updates.gender       = gender;
    if (phone        !== undefined) updates.phone        = phone;
    if (email        !== undefined) updates.email        = email;
    if (avatar_url   !== undefined) updates.avatar_url   = avatar_url;
    if (status       !== undefined) updates.status       = status;

    const { data, error } = await supabase.from('students').update(updates).eq('id', req.params.id).select().single();
    if (error) return res.status(404).json({ success: false, message: 'Student not found.' });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { error } = await supabase.from('students').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.status(200).json({ success: true, data: { message: 'Student deleted.' } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent };
