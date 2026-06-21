const express = require('express');
const router  = express.Router();
const {
  getReportsOverview,
  getTeacherTaskStats,
  getGradeDistribution,
  getAttendanceBreakdown,
  generateReport,
  sendReport,
  getReportsList,
  getSentReports,
  deleteReport,
  downloadDocument,
} = require('../controllers/reportsController');
const auth      = require('../middleware/auth');
const isManager = require('../middleware/isManager');

// All routes require auth
router.use(auth);

// Owner-accessible routes (no isManager)
router.get('/sent',               getSentReports);
router.get('/:id/document',       downloadDocument);

// Manager + Owner stats & management
router.use(isManager);
router.get('/overview',           getReportsOverview);
router.get('/teacher-tasks',      getTeacherTaskStats);
router.get('/grade-distribution', getGradeDistribution);
router.get('/attendance-breakdown', getAttendanceBreakdown);
router.get('/list',               getReportsList);
router.post('/generate',          generateReport);
router.put('/:id/send',           sendReport);
router.delete('/:id',             deleteReport);

module.exports = router;
