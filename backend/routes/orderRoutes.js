const express = require('express');
const router = express.Router();
const {
  createOrder,
  trackByPhone,
  calculateOrderPricing,
  getOrderById
} = require('../controllers/orderController');

/**
 * Order Routes - Seamless Client Strategy
 * 
 * These routes handle order creation and tracking with automatic client onboarding.
 * No manual registration required - clients are created automatically based on phone number.
 */

// Public routes (for client app)
router.post('/calculate', calculateOrderPricing);
router.post('/', createOrder);

// GET /api/orders/track/:phone - Track orders by phone number
router.get('/track/:phone', trackByPhone);

// GET /api/orders/:orderId - Get order details by ID
router.get('/:orderId', getOrderById);

// Assignment routes (temporarily commented out for debugging)
// router.put('/:orderId/assign-rider', assignRider);
// router.put('/:orderId/assign-partner', assignPartner);
// router.put('/:orderId/confirm', confirmOrder);
// router.get('/available-riders', getAvailableRiders);
// router.get('/available-partners', getAvailablePartners);

module.exports = router;