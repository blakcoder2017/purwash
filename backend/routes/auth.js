const express = require('express');
const router = express.Router();
const {
  register,
  login,
  adminLogin,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  verifyAndSetupMomo,
  getProfileCompleteness
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);
router.post('/refresh-token', authenticateToken, refreshToken);
router.post('/verify-momo', authenticateToken, verifyAndSetupMomo);
router.get('/profile-completeness', authenticateToken, getProfileCompleteness);

module.exports = router;
