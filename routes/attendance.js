const express = require('express');
const router  = express.Router();
const { getAttendance, saveAttendance, getAttendanceStats } = require('../controllers/attendanceController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/',       getAttendance);
router.get('/stats',  getAttendanceStats);
router.post('/',      saveAttendance);

module.exports = router;
