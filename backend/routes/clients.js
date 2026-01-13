const express = require('express');
const router = express.Router();
const { createOrder, getOrderTracking } = require('../controllers/orderController');

// Submit a new order & get Paystack URL
router.post('/orders', createOrder);

// Track an order via 6-digit ID
router.get('/orders/track/:friendlyId', getOrderTracking);

module.exports = router;