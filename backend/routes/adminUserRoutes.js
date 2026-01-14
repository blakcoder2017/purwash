const express = require('express');
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  getAdminUsers,
  getAdminUser,
  updateAdminUser,
  deleteAdminUser,
  toggleAdminStatus,
  resetAdminPassword,
  getAdminActivityLog,
  getCurrentAdmin,
  updateCurrentAdmin,
  getDashboardStats,
  getOrders,
  getPartners,
  getRiders
} = require('../controllers/adminUserController');
const { authenticateAdmin, requirePermission, requireRole } = require('../middleware/adminJwtAuth');

// Public routes
router.post('/login', loginAdmin);

// Protected routes (all require authentication)
router.use(authenticateAdmin);

// Current admin profile
router.get('/profile', getCurrentAdmin);
router.put('/profile', updateCurrentAdmin);

// Dashboard routes (must come before /:adminId routes)
router.get('/dashboard/stats', requirePermission('analytics', 'read'), getDashboardStats);
router.get('/orders', requirePermission('orders', 'read'), getOrders);

router.get('/partners', requirePermission('partners', 'read'), getPartners);
router.get('/riders', requirePermission('riders', 'read'), getRiders);

// Admin user management (requires admin users write permission)
router.post('/', requirePermission('users', 'write'), registerAdmin);
router.get('/', requirePermission('users', 'read'), getAdminUsers);
router.get('/:adminId', requirePermission('users', 'read'), getAdminUser);
router.put('/:adminId', requirePermission('users', 'write'), updateAdminUser);
router.delete('/:adminId', requirePermission('users', 'delete'), deleteAdminUser);
router.patch('/:adminId/toggle-status', requirePermission('users', 'write'), toggleAdminStatus);
router.post('/:adminId/reset-password', requirePermission('users', 'write'), resetAdminPassword);
router.get('/:adminId/activity', requirePermission('users', 'read'), getAdminActivityLog);

module.exports = router;
