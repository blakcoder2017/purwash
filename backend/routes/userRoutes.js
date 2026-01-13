const express = require('express');
const router = express.Router();
const { verifyAndSetupMomo } = require('../controllers/userController');

// Route for Rider/Laundry to verify MoMo and setup Paystack subaccount
// Path: /api/users/verify-momo
router.post('/verify-momo', verifyAndSetupMomo);

// You can add more routes here later, e.g.:
// router.get('/wallet/:userId', getWalletDetails);
// router.patch('/profile/:userId', updateProfile);

module.exports = router;