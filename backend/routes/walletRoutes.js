const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
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
router.get('/', authenticateToken, getWalletData);

// Get transaction history with pagination and filtering
router.get('/transactions', authenticateToken, getTransactionHistory);

// Get earnings summary for different periods
router.get('/summary', authenticateToken, getEarningsSummary);

module.exports = router;
