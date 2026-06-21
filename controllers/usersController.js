const bcrypt   = require('bcryptjs');
const supabase = require('../db/supabase');

const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users').select('id, login_id, full_name, email, role, income, avatar_url, created_at, updated_at')
      .order('role').order('full_name');
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('GetAllUsers:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users').select('id, login_id, full_name, email, role, income, avatar_url, created_at, updated_at')
      .eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateUser = async (req, res) => {
  const { full_name, email, role, income, avatar_url } = req.body;
  try {
    if (email) {
      const { data: dup } = await supabase.from('users').select('id').eq('email', email).neq('id', req.params.id).limit(1);
      if (dup?.length) return res.status(409).json({ success: false, message: 'Email already in use.' });
    }
    const updates = {};
    if (full_name  !== undefined) updates.full_name  = full_name;
    if (email      !== undefined) updates.email      = email;
    if (role       !== undefined) updates.role       = role;
    if (income     !== undefined) updates.income     = income;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    const { data, error } = await supabase
      .from('users').update(updates).eq('id', req.params.id)
      .select('id, login_id, full_name, email, role, income, avatar_url, created_at, updated_at').single();
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('UpdateUser:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id)
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.status(200).json({ success: true, data: { message: 'User deleted.' } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updatePassword = async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6)
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const { error } = await supabase.from('users').update({ password: hashed }).eq('id', req.params.id);
    if (error) throw error;
    return res.status(200).json({ success: true, data: { message: 'Password updated.' } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, updatePassword };
