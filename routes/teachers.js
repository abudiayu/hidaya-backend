const express = require('express');
const router  = express.Router();
const { getAllTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher } = require('../controllers/teachersController');
const auth      = require('../middleware/auth');
const isManager = require('../middleware/isManager');

router.use(auth);

router.get('/',    getAllTeachers);
router.get('/:id', getTeacherById);
router.post('/',   isManager, createTeacher);
router.put('/:id', isManager, updateTeacher);
router.delete('/:id', isManager, deleteTeacher);

module.exports = router;
