const express = require('express');
const router  = express.Router();
const { getAllTasks, createTask, updateTask, deleteTask } = require('../controllers/tasksController');
const auth      = require('../middleware/auth');
const isManager = require('../middleware/isManager');

router.use(auth);

router.get('/',    getAllTasks);
router.post('/',   isManager, createTask);
router.put('/:id', isManager, updateTask);
router.delete('/:id', isManager, deleteTask);

module.exports = router;
