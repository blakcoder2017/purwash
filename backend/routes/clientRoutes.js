const express = require('express');
const router = express.Router();
const {
  getClientByPhone,
  getClientOrders,
  updateClientProfile,
  addSavedLocation,
  getClientStats,
  deleteSavedLocation
} = require('../controllers/clientController');

/**
 * Client Routes - Seamless Client Strategy
 * 
 * These routes handle client profile management, order history, and preferences.
 * All operations are phone-number based for seamless access.
 */

// GET /api/clients/:phone - Get client profile by phone
router.get('/:phone', getClientByPhone);

// GET /api/clients/:phone/orders - Get client's order history
router.get('/:phone/orders', getClientOrders);

// GET /api/clients/:phone/stats - Get client statistics and analytics
router.get('/:phone/stats', getClientStats);

// PATCH /api/clients/:phone - Update client profile
router.patch('/:phone', updateClientProfile);

// POST /api/clients/:phone/locations - Add saved location
router.post('/:phone/locations', addSavedLocation);

// DELETE /api/clients/:phone/locations/:locationId - Delete saved location
router.delete('/:phone/locations/:locationId', deleteSavedLocation);

module.exports = router;
