// routes/webhook.js
const express = require('express');
const router = express.Router();
const { 
  handlePaystackWebhook, 
  testWebhook 
} = require('../controllers/webhookController');

// Paystack webhook endpoint
router.post('/paystack/webhook', handlePaystackWebhook);

// Test endpoint for development
router.get('/test', testWebhook);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'PurWash Webhook Service'
  });
});

module.exports = router;