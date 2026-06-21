const supabase = require('../db/supabase');

const getAttendance = async (req, res) => {
  try {
    let query = supabase.from('attendance').select('*');
    if (req.query.type)      query = query.eq('entity_type', req.query.type);
    if (req.query.date)      query = query.eq('date', req.query.date);
    if (req.query.entity_id) query = query.eq('entity_id', req.query.entity_id);
    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const saveAttendance = async (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records) || !records.length)
    return res.status(400).json({ success: false, message: 'records array is required.' });
  try {
    for (const r of records) {
      // Upsert: delete existing then insert
      await supabase.from('attendance')
        .delete().eq('entity_type', r.entity_type).eq('entity_id', r.entity_id).eq('date', r.date);
      await supabase.from('attendance').insert({
        entity_type: r.entity_type, entity_id: r.entity_id, date: r.date,
        status: r.status || 'Present', confirmed_by: req.user.id, confirmed_at: new Date().toISOString()
      });
    }
    return res.status(200).json({ success: true, data: { message: `${records.length} records saved.` } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getAttendanceStats = async (req, res) => {
  try {
    const { data, error } = await supabase.from('attendance').select('entity_type, status');
    if (error) throw error;
    const grouped = {};
    for (const row of data) {
      if (!grouped[row.entity_type]) grouped[row.entity_type] = { total:0, present:0, absent:0, late:0 };
      grouped[row.entity_type].total++;
      if (row.status === 'Present') grouped[row.entity_type].present++;
      if (row.status === 'Absent')  grouped[row.entity_type].absent++;
      if (row.status === 'Late')    grouped[row.entity_type].late++;
    }
    const result = Object.entries(grouped).map(([entity_type, s]) => ({
      entity_type, ...s, pct: s.total > 0 ? +(s.present / s.total * 100).toFixed(1) : 0
    }));
    return res.status(200).json({ success: true, data: result });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { getAttendance, saveAttendance, getAttendanceStats };
