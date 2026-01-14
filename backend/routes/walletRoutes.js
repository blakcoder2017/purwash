const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getWalletData,
  getTransactionHistory,
  getEarningsSummary
} = require('../controllers/walletController');

/**
 * Wallet Routes
 * All routes require authentication
 */

// Get wallet overview with balance and recent activity
router.get('/', protect, getWalletData);

// Get transaction history with pagination and filtering
router.get('/transactions', protect, getTransactionHistory);

// Get earnings summary for different periods
router.get('/summary', protect, getEarningsSummary);

module.exports = router;
