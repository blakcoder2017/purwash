const express = require('express');
const router = express.Router();
const { verifyAndSetupMomo, updateOnlineStatus } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// Route for Rider/Laundry to verify MoMo and setup Paystack subaccount
// Path: /api/users/verify-momo
router.post('/verify-momo', authenticateToken, verifyAndSetupMomo);

// Route for updating online status
// Path: /api/users/online-status
router.patch('/online-status', authenticateToken, updateOnlineStatus);

// You can add more routes here later, e.g.:
// router.get('/wallet/:userId', getWalletDetails);
// router.patch('/profile/:userId', updateProfile);

module.exports = router;