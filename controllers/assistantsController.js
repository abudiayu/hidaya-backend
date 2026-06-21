const supabase = require('../db/supabase');

const getAllAssistants = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('assistants').select('*, assistant_responsibilities(responsibility)').order('full_name');
    if (error) throw error;
    return res.status(200).json({ success: true, data: data.map(a => ({
      ...a, responsibilities: a.assistant_responsibilities?.map(r => r.responsibility)||[], assistant_responsibilities:undefined
    })) });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getAssistantById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('assistants').select('*, assistant_responsibilities(responsibility)').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, message: 'Assistant not found.' });
    return res.status(200).json({ success: true, data: { ...data, responsibilities: data.assistant_responsibilities?.map(r => r.responsibility)||[], assistant_responsibilities:undefined } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const createAssistant = async (req, res) => {
  const { assistant_code, full_name, role_title, department, age, gender, phone, email, experience, rating, status, avatar_url, responsibilities } = req.body;
  if (!assistant_code || !full_name) return res.status(400).json({ success: false, message: 'assistant_code and full_name required.' });
  try {
    const { data: dup } = await supabase.from('assistants').select('id').eq('assistant_code', assistant_code).limit(1);
    if (dup?.length) return res.status(409).json({ success: false, message: 'Code already exists.' });

    const { data, error } = await supabase.from('assistants')
      .insert({ assistant_code, full_name, role_title:role_title||'Junior Assistant', department:department||null, age:age||null, gender:gender||null, phone:phone||null, email:email||null, experience:experience||null, rating:rating||0, status:status||'Active', avatar_url:avatar_url||null })
      .select().single();
    if (error) throw error;

    if (Array.isArray(responsibilities) && responsibilities.length)
      await supabase.from('assistant_responsibilities').insert(responsibilities.map(r => ({ assistant_id: data.id, responsibility: r })));

    return res.status(201).json({ success: true, data });
  } catch (err) { console.error('CreateAssistant:', err); return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const updateAssistant = async (req, res) => {
  const { responsibilities, ...fields } = req.body;
  try {
    const updates = {};
    ['full_name','role_title','department','age','gender','phone','email','experience','rating','status','avatar_url']
      .forEach(k => { if (fields[k] !== undefined) updates[k] = fields[k]; });

    const { data, error } = await supabase.from('assistants').update(updates).eq('id', req.params.id).select().single();
    if (error) return res.status(404).json({ success: false, message: 'Assistant not found.' });

    if (Array.isArray(responsibilities)) {
      await supabase.from('assistant_responsibilities').delete().eq('assistant_id', req.params.id);
      if (responsibilities.length) await supabase.from('assistant_responsibilities').insert(responsibilities.map(r => ({ assistant_id: req.params.id, responsibility: r })));
    }
    return res.status(200).json({ success: true, data });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const deleteAssistant = async (req, res) => {
  try {
    const { error } = await supabase.from('assistants').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.status(200).json({ success: true, data: { message: 'Assistant deleted.' } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { getAllAssistants, getAssistantById, createAssistant, updateAssistant, deleteAssistant };
