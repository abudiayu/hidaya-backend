const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const { login, register, getMe, changePassword } = require('../controllers/authController');
const auth = require('../middleware/auth');

// POST /api/auth/login
router.post('/login',
  [
    body('login_id').trim().notEmpty().withMessage('Login ID is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  login
);

// POST /api/auth/register
router.post('/register',
  [
    body('login_id').trim().notEmpty().withMessage('Login ID is required.'),
    body('full_name').trim().notEmpty().withMessage('Full name is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  ],
  register
);

// GET /api/auth/me
router.get('/me', auth, getMe);

// PUT /api/auth/change-password
router.put('/change-password', auth, changePassword);

module.exports = router;
