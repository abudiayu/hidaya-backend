const supabase = require('../db/supabase');

const getNisabValue = async () => {
  const { data } = await supabase.from('settings').select('value').eq('key_name', 'nisab_value').single();
  return data ? parseFloat(data.value) : 595;
};

const getSchoolNetIncome = async () => {
  const { data: fees } = await supabase.from('payments').select('amount').eq('is_paid', true);
  const { data: spon } = await supabase.from('sponsorships').select('amount').eq('status', 'received');
  const student_fees = (fees||[]).reduce((s, p) => s + Number(p.amount), 0);
  const sponsorship  = (spon||[]).reduce((s, p) => s + Number(p.amount), 0);
  return { student_fees, sponsorship, total: parseFloat((student_fees + sponsorship).toFixed(2)) };
};

const computeZakat = (annual_income, nisab_value) => {
  const is_liable      = annual_income >= nisab_value;
  const zakat_amount   = is_liable ? parseFloat((annual_income * 0.025).toFixed(2)) : 0;
  const monthly_zakat  = parseFloat((zakat_amount / 12).toFixed(2));
  const net_after_zakat = parseFloat((annual_income - zakat_amount).toFixed(2));
  return { is_liable, zakat_amount, monthly_zakat, net_after_zakat };
};

const calculateZakat = async (req, res) => {
  try {
    const nisab_value   = await getNisabValue();
    const income        = await getSchoolNetIncome();
    const zakat         = computeZakat(income.total, nisab_value);
    return res.status(200).json({ success: true, data: { annual_income: income.total, nisab_value, ...zakat, income_sources: income } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getZakatHistory = async (req, res) => {
  try {
    const { data, error } = await supabase.from('zakat_records').select('*').eq('user_id', req.user.id).order('calculated_at', { ascending: false }).limit(20);
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const saveZakatRecord = async (req, res) => {
  const { annual_income, nisab_value, zakat_amount, is_liable } = req.body;
  if ([annual_income, nisab_value, zakat_amount, is_liable].some(v => v === undefined))
    return res.status(400).json({ success: false, message: 'All fields required.' });
  try {
    const { data, error } = await supabase.from('zakat_records')
      .insert({ user_id: req.user.id, annual_income, nisab_value, zakat_amount, is_liable: !!is_liable })
      .select().single();
    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getIncomeBreakdown = async (req, res) => {
  try {
    const { data: payments } = await supabase.from('payments').select('is_paid, amount, students(grade)');
    const byGrade = {};
    for (const p of payments||[]) {
      const grade = p.students?.grade || 'Unknown';
      if (!byGrade[grade]) byGrade[grade] = { grade, total_students:0, paid_count:0, collected:0, outstanding:0 };
      byGrade[grade].total_students++;
      if (p.is_paid) { byGrade[grade].paid_count++; byGrade[grade].collected += Number(p.amount); }
      else           { byGrade[grade].outstanding += Number(p.amount); }
    }
    const { data: sponsorships } = await supabase.from('sponsorships').select('*').order('received_date', { ascending: false });
    const income = await getSchoolNetIncome();
    const nisab_value = await getNisabValue();
    const zakat = computeZakat(income.total, nisab_value);
    return res.status(200).json({ success: true, data: { by_grade: Object.values(byGrade), sponsorships: sponsorships||[], totals: income, nisab_value, ...zakat } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const addSponsorship = async (req, res) => {
  const { donor_name, amount, description, received_date } = req.body;
  if (!donor_name || !amount) return res.status(400).json({ success: false, message: 'donor_name and amount are required.' });
  try {
    const { data, error } = await supabase.from('sponsorships')
      .insert({ donor_name, amount: parseFloat(amount), description: description||null, received_date: received_date||new Date().toISOString().split('T')[0], status: 'received', recorded_by: req.user.id })
      .select().single();
    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const deleteSponsorship = async (req, res) => {
  try {
    const { error } = await supabase.from('sponsorships').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.status(200).json({ success: true, data: { message: 'Deleted.' } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { calculateZakat, getZakatHistory, saveZakatRecord, getIncomeBreakdown, addSponsorship, deleteSponsorship };
