const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const AuditLog = require('../models/AuditLogs');
const { getDashboardStats, assignOrder, forceConfirmDelivery, getInvestorMetrics, banUser } = require('../controllers/adminController');

// All paths here are prefixed with /api/admin in index.js

router.use(adminAuth);

router.get('/investor-metrics', getInvestorMetrics);
router.post('/ban-partner', banUser);
router.get('/stats', getDashboardStats);
router.post('/assign', assignOrder);
router.patch('/force-confirm/:orderId', forceConfirmDelivery);
router.get('/logs', async (req, res) => {
  const logs = await AuditLog.find()
    .populate('performedBy', 'name')
    .populate('orderId', 'friendlyId')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(logs);
});

module.exports = router;