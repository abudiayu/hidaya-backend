const express = require('express');
const router  = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser, updatePassword } = require('../controllers/usersController');
const auth      = require('../middleware/auth');
const isManager = require('../middleware/isManager');

router.use(auth, isManager);

router.get('/',               getAllUsers);
router.get('/:id',            getUserById);
router.put('/:id',            updateUser);
router.delete('/:id',         deleteUser);
router.put('/:id/password',   updatePassword);

module.exports = router;
