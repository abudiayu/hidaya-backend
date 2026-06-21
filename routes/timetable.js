const express = require('express');
const router  = express.Router();
const { getTimetable, updateSlot } = require('../controllers/timetableController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', getTimetable);
router.put('/:day/:period', updateSlot);

module.exports = router;
