const express = require('express');
const router = express.Router();
const {
  getCatalog,
  getItem,
  getFilters,
  getPopularItems,
  calculateOrderPreview,
  // Admin routes
  createItem,
  updateItem,
  deleteItem,
  getAllItems
} = require('../controllers/laundryItemController');
const { optionalAuth } = require('../middleware/auth');

/**
 * Laundry Item Routes
 * 
 * Client-facing catalog routes and admin management routes
 */

// === CLIENT-FACING ROUTES ===

// 1. Get full catalog with filtering and pagination
router.get('/catalog', getCatalog);

// 2. Get single item by slug
router.get('/item/:slug', getItem);

// 3. Get available filters (categories, service types, price range)
router.get('/filters', getFilters);

// 4. Get popular items for homepage
router.get('/popular', getPopularItems);

// 5. Calculate order preview (for cart/checkout)
router.post('/calculate-preview', calculateOrderPreview);

// === ADMIN ROUTES ===
// These should be protected with admin/auth middleware

// 6. Create new item (Admin)
router.post('/admin/items', createItem);

// 7. Update existing item (Admin)
router.put('/admin/items/:id', updateItem);

// 8. Deactivate item (Admin)
router.delete('/admin/items/:id', deleteItem);

// 9. Get all items including inactive (Admin)
router.get('/admin/items', getAllItems);

module.exports = router;
