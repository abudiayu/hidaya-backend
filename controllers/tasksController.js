const supabase = require('../db/supabase');

const getAllTasks = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks').select('*, users!assigned_by(full_name)').order('created_at', { ascending: false });
    if (error) throw error;
    // Enrich with assignee names
    const result = await Promise.all(data.map(async t => {
      let assignee_name = null;
      if (t.assignee_type === 'teacher') {
        const { data: a } = await supabase.from('teachers').select('full_name').eq('id', t.assignee_id).single();
        assignee_name = a?.full_name;
      } else if (t.assignee_type === 'assistant') {
        const { data: a } = await supabase.from('assistants').select('full_name').eq('id', t.assignee_id).single();
        assignee_name = a?.full_name;
      }
      return { ...t, assigned_by_name: t.users?.full_name, users: undefined, assignee_name };
    }));
    return res.status(200).json({ success: true, data: result });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const createTask = async (req, res) => {
  const { assignee_type, assignee_id, description, due_date } = req.body;
  if (!assignee_type || !assignee_id || !description)
    return res.status(400).json({ success: false, message: 'assignee_type, assignee_id and description are required.' });
  try {
    const { data, error } = await supabase.from('tasks')
      .insert({ assigned_by: req.user.id, assignee_type, assignee_id, description, due_date: due_date||null })
      .select().single();
    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const updateTask = async (req, res) => {
  const { status, description, due_date } = req.body;
  try {
    const updates = {};
    if (status      !== undefined) updates.status      = status;
    if (description !== undefined) updates.description = description;
    if (due_date    !== undefined) updates.due_date    = due_date;
    if (status === 'completed')    updates.completed_at = new Date().toISOString();
    const { data, error } = await supabase.from('tasks').update(updates).eq('id', req.params.id).select().single();
    if (error) return res.status(404).json({ success: false, message: 'Task not found.' });
    return res.status(200).json({ success: true, data });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const deleteTask = async (req, res) => {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.status(200).json({ success: true, data: { message: 'Task deleted.' } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { getAllTasks, createTask, updateTask, deleteTask };
