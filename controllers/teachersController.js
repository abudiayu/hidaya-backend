const supabase = require('../db/supabase');

const getAllTeachers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('teachers').select('*, teacher_classes(class_name)').order('full_name');
    if (error) throw error;
    const result = data.map(t => ({
      ...t,
      classes: t.teacher_classes?.map(c => c.class_name) || [],
      teacher_classes: undefined,
    }));
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('GetAllTeachers:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getTeacherById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('teachers').select('*, teacher_classes(class_name)').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, message: 'Teacher not found.' });

    const teacher = { ...data, classes: data.teacher_classes?.map(c => c.class_name) || [], teacher_classes: undefined };

    // Attendance %
    const { data: att } = await supabase.from('attendance').select('status').eq('entity_type','teacher').eq('entity_id', req.params.id);
    if (att?.length) {
      const present = att.filter(a => a.status === 'Present').length;
      teacher.attendance_pct = Math.round((present / att.length) * 100) + '%';
    } else { teacher.attendance_pct = '0%'; }

    // Tasks %
    const { data: tsks } = await supabase.from('tasks').select('status').eq('assignee_type','teacher').eq('assignee_id', req.params.id);
    if (tsks?.length) {
      const done = tsks.filter(t => t.status === 'completed').length;
      teacher.tasks_completed_pct = Math.round((done / tsks.length) * 100) + '%';
    } else { teacher.tasks_completed_pct = '0%'; }

    return res.status(200).json({ success: true, data: teacher });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createTeacher = async (req, res) => {
  const { teacher_code, full_name, subject, department, branch, age, gender, phone, email, experience, rating, status, avatar_url, current_topic, classes } = req.body;
  if (!teacher_code || !full_name || !subject)
    return res.status(400).json({ success: false, message: 'teacher_code, full_name, subject required.' });
  try {
    const { data: dup } = await supabase.from('teachers').select('id').eq('teacher_code', teacher_code).limit(1);
    if (dup?.length) return res.status(409).json({ success: false, message: 'Teacher code already exists.' });

    const { data: t, error } = await supabase.from('teachers')
      .insert({ teacher_code, full_name, subject, department:department||null, branch:branch||'Main Campus', age:age||null, gender:gender||null, phone:phone||null, email:email||null, experience:experience||null, rating:rating||0, status:status||'Active', avatar_url:avatar_url||null, current_topic:current_topic||null })
      .select().single();
    if (error) throw error;

    if (Array.isArray(classes) && classes.length) {
      await supabase.from('teacher_classes').insert(classes.map(c => ({ teacher_id: t.id, class_name: c })));
    }
    return res.status(201).json({ success: true, data: t });
  } catch (err) {
    console.error('CreateTeacher:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateTeacher = async (req, res) => {
  const { full_name, subject, department, branch, age, gender, phone, email, experience, rating, status, avatar_url, current_topic, classes } = req.body;
  try {
    const updates = {};
    ['full_name','subject','department','branch','age','gender','phone','email','experience','rating','status','avatar_url','current_topic']
      .forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const { data, error } = await supabase.from('teachers').update(updates).eq('id', req.params.id)
      .select('*, teacher_classes(class_name)').single();
    if (error) return res.status(404).json({ success: false, message: 'Teacher not found.' });

    if (Array.isArray(classes)) {
      await supabase.from('teacher_classes').delete().eq('teacher_id', req.params.id);
      if (classes.length) await supabase.from('teacher_classes').insert(classes.map(c => ({ teacher_id: req.params.id, class_name: c })));
    }
    return res.status(200).json({ success: true, data: { ...data, classes: data.teacher_classes?.map(c => c.class_name)||[], teacher_classes:undefined } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteTeacher = async (req, res) => {
  try {
    const { error } = await supabase.from('teachers').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.status(200).json({ success: true, data: { message: 'Teacher deleted.' } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher };
