const express = require('express');
const router = express.Router();
const {
  stepOneBasicInfo,
  stepTwoBusinessInfo,
  stepThreePaymentSetup,
  getRegistrationStatus,
  verifyMoMoAndCreateRecipient
} = require('../controllers/partnerRegistrationController');
const { authenticateToken } = require('../middleware/auth');
const { validateStepOne, validateStepTwo, validateStepThree } = require('../middleware/registrationValidation');

/**
 * Multi-step registration for Riders and Partners
 * Step 1: Basic Information (email, password, name, phone)
 * Step 2: Business Information (business name, location, hours, bio)
 * Step 3: Payment Setup (MoMo, profile picture)
 */

// Step 1: Basic Information (Public route)
router.post('/step-1', validateStepOne, stepOneBasicInfo);

// Step 2: Business Information (Protected with temp token)
router.post('/step-2', authenticateToken, validateStepTwo, stepTwoBusinessInfo);

// Step 3: Payment Setup (Protected with temp token)
router.post('/step-3', authenticateToken, validateStepThree, stepThreePaymentSetup);

// Get registration status (Protected)
router.get('/status', authenticateToken, getRegistrationStatus);

// Verify MoMo and create recipient (Protected - for post-registration verification)
router.post('/verify-momo', authenticateToken, verifyMoMoAndCreateRecipient);

module.exports = router;
