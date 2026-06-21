const express = require('express');
const router  = express.Router();
const { getTopics, createTopic } = require('../controllers/topicsController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/',  getTopics);
router.post('/', createTopic);

module.exports = router;
