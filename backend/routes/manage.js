const express = require('express');
const router = express.Router();
const { 
  assignStakeholders, 
  updateOrderStatus, 
  getPendingOrders 
} = require('../controllers/manageController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Admin: Assign Rider and Laundry to an order
// router.patch('/orders/:id/assign', assignStakeholders);

// Rider/Laundry: Move order through the workflow
// router.patch('/orders/:id/status', updateOrderStatus);

// Admin: View all orders needing assignment
// router.get('/orders/pending', getPendingOrders);

// Get pending orders (for riders and partners)
router.get('/orders/pending', authenticateToken, authorizeRoles(['rider', 'partner']), getPendingOrders);

// Update order status (for riders and partners)
router.patch('/orders/:orderId/status', authenticateToken, authorizeRoles(['rider', 'partner']), updateOrderStatus);

// Assign stakeholders (admin only)
router.post('/assign', authenticateToken, authorizeRoles(['admin']), assignStakeholders);

module.exports = router;