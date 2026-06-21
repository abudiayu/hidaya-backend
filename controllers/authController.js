const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const supabase = require('../db/supabase');
require('dotenv').config();

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, login_id: user.login_id, email: user.email, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// POST /api/auth/login
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  const { login_id, password, role } = req.body;
  if (!login_id || !password) return res.status(400).json({ success: false, message: 'login_id and password are required.' });

  try {
    const { data: users, error } = await supabase
      .from('users').select('*').eq('login_id', String(login_id).trim()).limit(1);
    if (error) throw error;
    if (!users.length) {
      console.log(`[Login] ❌ login_id not found: "${login_id}"`);
      return res.status(401).json({ success: false, message: 'Invalid ID or password.' });
    }

    const user = users[0];
    console.log(`[Login] 👤 Found user: ${user.login_id} (role: ${user.role})`);

    if (role && user.role !== role) {
      return res.status(401).json({ success: false, message: `This ID belongs to a ${user.role} account, not ${role}.` });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    console.log(`[Login] 🔑 Password match: ${isMatch}`);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid ID or password.' });

    // Profile data for teacher/assistant
    let profileData = {};
    if (user.role === 'teacher') {
      const { data: tp } = await supabase.from('teachers').select('*, teacher_classes(class_name)').eq('user_id', user.id).limit(1);
      if (tp?.length) profileData = { ...tp[0], classes: tp[0].teacher_classes?.map(c => c.class_name) || [], teacher_classes: undefined };
    } else if (user.role === 'assistant') {
      const { data: ap } = await supabase.from('assistants').select('*, assistant_responsibilities(responsibility)').eq('user_id', user.id).limit(1);
      if (ap?.length) profileData = { ...ap[0], responsibilities: ap[0].assistant_responsibilities?.map(r => r.responsibility) || [], assistant_responsibilities: undefined };
    }

    const token = generateToken(user);
    const { password: _pw, ...safeUser } = user;
    console.log(`[Login] ✅ Success for ${user.login_id}`);
    return res.status(200).json({ success: true, data: { user: { ...safeUser, profile: profileData }, token } });
  } catch (err) {
    console.error('[Login] 💥 Server error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// POST /api/auth/register
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  const { login_id, full_name, email, password, role } = req.body;
  try {
    const { data: existId } = await supabase.from('users').select('id').eq('login_id', login_id).limit(1);
    if (existId?.length) return res.status(409).json({ success: false, message: 'Login ID already taken.' });

    if (email) {
      const { data: existEmail } = await supabase.from('users').select('id').eq('email', email).limit(1);
      if (existEmail?.length) return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const allowedRoles = ['owner','manager','assistant','teacher'];
    const userRole = allowedRoles.includes(role) ? role : 'teacher';

    const { data: newUser, error } = await supabase
      .from('users').insert({ login_id, full_name, email: email || null, password: hashed, role: userRole })
      .select('id, login_id, full_name, email, role, created_at').single();
    if (error) throw error;

    const token = generateToken(newUser);
    return res.status(201).json({ success: true, data: { user: newUser, token } });
  } catch (err) {
    console.error('[Register] error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users').select('id, login_id, full_name, email, role, income, avatar_url, created_at, updated_at')
      .eq('id', req.user.id).single();
    if (error || !data) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[GetMe] error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ success: false, message: 'current_password and new_password are required.' });
  if (new_password.length < 6) return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
  try {
    const { data: users } = await supabase.from('users').select('*').eq('id', req.user.id).limit(1);
    if (!users?.length) return res.status(404).json({ success: false, message: 'User not found.' });
    const isMatch = await bcrypt.compare(current_password, users[0].password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    const hashed = await bcrypt.hash(new_password, 10);
    const { error } = await supabase.from('users').update({ password: hashed }).eq('id', req.user.id);
    if (error) throw error;
    return res.status(200).json({ success: true, data: { message: 'Password updated successfully.' } });
  } catch (err) {
    console.error('[ChangePassword] error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { login, register, getMe, changePassword };
