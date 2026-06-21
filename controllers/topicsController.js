const supabase = require('../db/supabase');

const getTopics = async (req, res) => {
  try {
    let query = supabase.from('daily_topics').select('*, teachers(full_name)').order('date', { ascending: false }).order('created_at', { ascending: false });
    if (req.query.teacher_id) query = query.eq('teacher_id', req.query.teacher_id);
    if (req.query.date)       query = query.eq('date', req.query.date);
    const { data, error } = await query;
    if (error) throw error;
    const result = data.map(t => ({ ...t, teacher_name: t.teachers?.full_name, teachers: undefined }));
    return res.status(200).json({ success: true, data: result });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const createTopic = async (req, res) => {
  const { teacher_id, subject, date, title, description, submitted_at } = req.body;
  if (!teacher_id || !subject || !date || !title)
    return res.status(400).json({ success: false, message: 'teacher_id, subject, date, title required.' });
  try {
    const { data, error } = await supabase.from('daily_topics')
      .insert({ teacher_id, subject, date, title, description: description||null, submitted_at: submitted_at||null })
      .select().single();
    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { getTopics, createTopic };
