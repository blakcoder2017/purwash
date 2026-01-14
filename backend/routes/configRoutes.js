const express = require('express');
const router = express.Router();
const { getPaystackConfig } = require('../controllers/configController');

/**
 * Configuration Routes
 */

// GET /api/config/paystack - Get Paystack configuration
router.get('/paystack', getPaystackConfig);

module.exports = router;
