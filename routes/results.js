const express = require('express');
const router  = express.Router();
const { getAllResults, getStudentResults, saveResult, getSubjects } = require('../controllers/resultsController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/subjects',          getSubjects);
router.get('/',                  getAllResults);
router.get('/student/:studentId', getStudentResults);
router.post('/',                  saveResult);

module.exports = router;
