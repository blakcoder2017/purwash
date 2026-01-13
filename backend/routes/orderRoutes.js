const express = require('express');
const router = express.Router();
const { createOrder, getOrderTracking, initializePayment } = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

// Client creates an order (requires authentication)
// Path: /api/orders (frontend expects this)
router.post('/', authenticateToken, createOrder);

// Client tracks an order via 6-digit friendly ID (public access)
// Path: /api/orders/:friendlyId (frontend expects this)
router.get('/:friendlyId', getOrderTracking);

module.exports = router;