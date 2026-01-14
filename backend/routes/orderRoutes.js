const express = require('express');
const router = express.Router();
const {
  createOrder,
  trackByPhone,
  trackOrderByPhoneAndCode,
  calculateOrderPricingHandler,
  getOrderById,
  verifyPaystackPayment
} = require('../controllers/orderController');

/**
 * Order Routes - Guest Checkout Strategy
 * 
 * These routes handle order creation and tracking without requiring signup.
 * Auto-generates order codes for easy tracking.
 */

// Public routes (for client app)
router.post('/calculate', calculateOrderPricingHandler);
router.post('/', createOrder);

// GET /api/orders/track/:phone/:code - Track order by phone and code (new)
router.get('/track/:phone/:code', trackOrderByPhoneAndCode);

// GET /api/orders/by-phone/:phone - Track orders by phone number (legacy)
router.get('/by-phone/:phone', trackByPhone);

// GET /api/orders/:orderId - Get order details by ID
router.get('/:orderId', getOrderById);

module.exports = router;