const express = require('express');
const router  = express.Router();
const { getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent } = require('../controllers/studentsController');
const auth      = require('../middleware/auth');
const isManager = require('../middleware/isManager');

router.use(auth);

router.get('/',    getAllStudents);
router.get('/:id', getStudentById);
router.post('/',   isManager, createStudent);
router.put('/:id', isManager, updateStudent);
router.delete('/:id', isManager, deleteStudent);

module.exports = router;
