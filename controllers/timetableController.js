const supabase = require('../db/supabase');

const DAY_ORDER = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5 };

const getTimetable = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('timetable').select('*, teachers(full_name)');
    if (error) throw error;
    // Sort by day then period
    const sorted = data
      .map(row => ({ ...row, teacher_name: row.teachers?.full_name, teachers: undefined }))
      .sort((a, b) => {
        const dDiff = (DAY_ORDER[a.day_name] || 0) - (DAY_ORDER[b.day_name] || 0);
        return dDiff !== 0 ? dDiff : a.period.localeCompare(b.period);
      });
    return res.status(200).json({ success: true, data: sorted });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const updateSlot = async (req, res) => {
  const { day, period } = req.params;
  const { subject, teacher_id, grade, class_name } = req.body;
  try {
    // Delete existing slot then upsert
    await supabase.from('timetable').delete().eq('day_name', day).eq('period', period);
    const { data, error } = await supabase.from('timetable')
      .insert({ day_name: day, period, subject: subject||null, teacher_id: teacher_id||null, grade: grade||null, class_name: class_name||null, updated_by: req.user.id, updated_at: new Date().toISOString() })
      .select('*, teachers(full_name)').single();
    if (error) throw error;
    return res.status(200).json({ success: true, data: { ...data, teacher_name: data.teachers?.full_name, teachers: undefined } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { getTimetable, updateSlot };
