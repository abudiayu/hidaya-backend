const express = require('express');
const router  = express.Router();
const { getAllPayments, createPayment, togglePayment, getPaymentStats } = require('../controllers/paymentsController');
const auth      = require('../middleware/auth');
const isManager = require('../middleware/isManager');

router.use(auth, isManager);

router.get('/',        getAllPayments);
router.get('/stats',   getPaymentStats);
router.post('/',       createPayment);
router.put('/:id/toggle', togglePayment);

module.exports = router;
