const express = require('express');
const router  = express.Router();
const { getAllSettings, updateSetting } = require('../controllers/settingsController');
const auth      = require('../middleware/auth');
const isManager = require('../middleware/isManager');

router.use(auth, isManager);

router.get('/',       getAllSettings);
router.put('/:key',   updateSetting);

module.exports = router;
