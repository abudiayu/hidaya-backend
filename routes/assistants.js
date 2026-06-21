const express = require('express');
const router  = express.Router();
const { getAllAssistants, getAssistantById, createAssistant, updateAssistant, deleteAssistant } = require('../controllers/assistantsController');
const auth      = require('../middleware/auth');
const isManager = require('../middleware/isManager');

router.use(auth);

router.get('/',    getAllAssistants);
router.get('/:id', getAssistantById);
router.post('/',   isManager, createAssistant);
router.put('/:id', isManager, updateAssistant);
router.delete('/:id', isManager, deleteAssistant);

module.exports = router;
