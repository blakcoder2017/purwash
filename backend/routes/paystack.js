const express = require('express');
const router = express.Router();
const { handlePaystackWebhook, initializePayment } = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

// Initialize payment for an order (requires authentication)
router.post('/initialize', authenticateToken, initializePayment);

// Paystack hits this when MoMo payment is complete (public webhook)
router.post('/webhook', handlePaystackWebhook);

module.exports = router;