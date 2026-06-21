const supabase = require('../db/supabase');

const getAllPayments = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payments').select('*, students(full_name, full_name_am, grade, phone, age, student_code)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    // Flatten join
    const flat = data.map(p => ({ ...p, ...p.students, students: undefined }));
    return res.status(200).json({ success: true, data: flat });
  } catch (err) { console.error('GetAllPayments:', err); return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const createPayment = async (req, res) => {
  const { student_id, amount, is_paid, paid_date, term } = req.body;
  if (!student_id || !amount) return res.status(400).json({ success: false, message: 'student_id and amount are required.' });
  try {
    const { data, error } = await supabase.from('payments')
      .insert({ student_id, amount, is_paid: !!is_paid, paid_date: paid_date||null, term: term||null, recorded_by: req.user.id })
      .select('*, students(full_name, grade, student_code)').single();
    if (error) throw error;
    return res.status(201).json({ success: true, data: { ...data, ...data.students, students: undefined } });
  } catch (err) { console.error('CreatePayment:', err); return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const togglePayment = async (req, res) => {
  try {
    const { data: existing } = await supabase.from('payments').select('is_paid').eq('id', req.params.id).single();
    if (!existing) return res.status(404).json({ success: false, message: 'Payment not found.' });
    const newPaid = !existing.is_paid;
    const { data, error } = await supabase.from('payments')
      .update({ is_paid: newPaid, paid_date: newPaid ? new Date().toISOString().split('T')[0] : null, recorded_by: req.user.id })
      .eq('id', req.params.id).select('*, students(full_name, grade, student_code)').single();
    if (error) throw error;
    return res.status(200).json({ success: true, data: { ...data, ...data.students, students: undefined } });
  } catch (err) { console.error('TogglePayment:', err); return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getPaymentStats = async (req, res) => {
  try {
    const { data, error } = await supabase.from('payments').select('is_paid, amount');
    if (error) throw error;
    const total     = data.length;
    const paid      = data.filter(p => p.is_paid).length;
    const not_paid  = total - paid;
    const collected = data.filter(p => p.is_paid).reduce((s, p) => s + Number(p.amount), 0);
    return res.status(200).json({ success: true, data: { total, paid, not_paid, collected } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { getAllPayments, createPayment, togglePayment, getPaymentStats };
