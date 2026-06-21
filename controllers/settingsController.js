const supabase = require('../db/supabase');

const getAllSettings = async (req, res) => {
  try {
    const { data, error } = await supabase.from('settings').select('*').order('key_name');
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const updateSetting = async (req, res) => {
  const { value } = req.body;
  if (value === undefined || value === null)
    return res.status(400).json({ success: false, message: 'value is required.' });
  try {
    // Upsert: try update first, then insert if not exists
    const { data: existing } = await supabase.from('settings').select('id').eq('key_name', req.params.key).limit(1);
    let data, error;
    if (existing?.length) {
      ({ data, error } = await supabase.from('settings')
        .update({ value, updated_by: req.user.id, updated_at: new Date().toISOString() })
        .eq('key_name', req.params.key).select().single());
    } else {
      ({ data, error } = await supabase.from('settings')
        .insert({ key_name: req.params.key, value, updated_by: req.user.id })
        .select().single());
    }
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { getAllSettings, updateSetting };
