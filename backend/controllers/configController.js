const express = require('express');
const router = express.Router();

/**
 * Get Paystack configuration
 * GET /api/config/paystack
 */
router.get('/paystack', (req, res) => {
  try {
    const publicKey = process.env.PAYSTACK_PUBLIC_KEY;
    
    if (!publicKey) {
      return res.status(500).json({
        success: false,
        message: 'Paystack public key not configured'
      });
    }

    res.json({
      success: true,
      data: {
        publicKey: publicKey
      }
    });
  } catch (error) {
    console.error('Error fetching Paystack config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Paystack configuration'
    });
  }
});

module.exports = router;
