const express = require('express');
const router  = express.Router();
const {
  calculateZakat,
  getZakatHistory,
  saveZakatRecord,
  getIncomeBreakdown,
  addSponsorship,
  deleteSponsorship,
} = require('../controllers/zakatController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/calculate',          calculateZakat);
router.get('/history',            getZakatHistory);
router.post('/save',              saveZakatRecord);
router.get('/income-breakdown',   getIncomeBreakdown);
router.post('/sponsorship',       addSponsorship);
router.delete('/sponsorship/:id', deleteSponsorship);

module.exports = router;
