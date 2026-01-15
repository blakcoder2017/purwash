const express = require('express');
const router = express.Router();
const { authenticateAdmin, requirePermission } = require('../middleware/adminAuth');
const AuditLog = require('../models/AuditLogs');
const AdminUser = require('../models/AdminUser');
const { 
  getDashboardStats, 
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  assignOrder, 
  forceConfirmDelivery,
  cancelOrder,
  getInvestorMetrics, 
  banUser,
  unbanUser,
  initiatePayout,
  getPayoutsSummary
} = require('../controllers/adminController');

const {
  getAllRiders,
  getRiderById,
  updateRider,
  toggleRiderStatus,
  getRiderAnalytics,
  addRiderNote,
  adjustRiderWallet,
  deleteRider
} = require('../controllers/riderManagementController');
const {
  getAllPartners,
  getPartnerById,
  updatePartner,
  togglePartnerStatus,
  verifyPartnerMoMo,
  getPartnerAnalytics,
  addPartnerNote,
  adjustPartnerWallet,
  deletePartner,
  getPartnerLocations
} = require('../controllers/partnerManagementController');

// All paths here are prefixed with /api/admin in index.js

router.use(authenticateAdmin);

// === DASHBOARD ===
router.get('/stats', getDashboardStats);
router.get('/investor-metrics', getInvestorMetrics);

// === ORDER MANAGEMENT ===
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.patch('/orders/:id/status', updateOrderStatus);
router.post('/orders/assign', assignOrder);
router.patch('/orders/:orderId/force-confirm', forceConfirmDelivery);
router.delete('/orders/:id', cancelOrder);



// === RIDER MANAGEMENT ===
router.get('/riders', getAllRiders);
router.get('/riders/:id', getRiderById);
router.patch('/riders/:id', updateRider);
router.patch('/riders/:id/status', toggleRiderStatus);
router.get('/riders/analytics', getRiderAnalytics);
router.post('/riders/:id/notes', addRiderNote);
router.post('/riders/:id/wallet/adjust', adjustRiderWallet);
router.delete('/riders/:id', deleteRider);

// === PARTNER MANAGEMENT ===
router.get('/partners', getAllPartners);
router.get('/partners/:id', getPartnerById);
router.patch('/partners/:id', updatePartner);
router.patch('/partners/:id/status', togglePartnerStatus);
router.patch('/partners/:id/momo/verify', verifyPartnerMoMo);
router.get('/partners/analytics', getPartnerAnalytics);
router.post('/partners/:id/notes', addPartnerNote);
router.post('/partners/:id/wallet/adjust', adjustPartnerWallet);
router.delete('/partners/:id', deletePartner);
router.get('/partners/locations', getPartnerLocations);

// === USER MANAGEMENT (GENERAL) ===
router.post('/ban-user', banUser);
router.post('/unban-user', unbanUser);

// === PAYOUT MANAGEMENT ===
router.post('/payout/initiate', initiatePayout);
router.get('/payouts/summary', getPayoutsSummary);

// === ADMIN USER MANAGEMENT ===
// Get current admin profile
router.get('/profile', async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.user.id).select('-password');
    res.json({ success: true, data: admin });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update current admin profile
router.put('/profile', async (req, res) => {
  try {
    const { profile } = req.body;
    const admin = await AdminUser.findByIdAndUpdate(
      req.user.id,
      { profile },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({ success: true, data: admin });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Get all admin users (requires users read permission)
router.get('/users', requirePermission('users', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    
    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;
    if (status) filter.isActive = status === 'active';
    
    const admins = await AdminUser.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await AdminUser.countDocuments(filter);
    
    res.json({
      success: true,
      data: admins,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin users', error: error.message });
  }
});

// Create new admin user (requires users write permission)
router.post('/users', requirePermission('users', 'write'), async (req, res) => {
  try {
    const { username, email, password, role = 'admin', permissions, profile } = req.body;
    
    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email or username already exists'
      });
    }
    
    const admin = new AdminUser({
      username,
      email,
      password,
      role,
      permissions: permissions || {},
      profile,
      createdBy: req.user.id
    });
    
    await admin.save();
    
    res.status(201).json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating admin user', error: error.message });
  }
});

// Get single admin user
router.get('/users/:adminId', requirePermission('users', 'read'), async (req, res) => {
  try {
    const { adminId } = req.params;
    const admin = await AdminUser.findById(adminId).select('-password');
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }
    
    res.json({ success: true, data: admin });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin user', error: error.message });
  }
});

// Update admin user
router.put('/users/:adminId', requirePermission('users', 'write'), async (req, res) => {
  try {
    const { adminId } = req.params;
    const updates = req.body;
    
    // Remove sensitive fields
    delete updates.password;
    delete updates.createdBy;
    
    const admin = await AdminUser.findByIdAndUpdate(
      adminId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }
    
    res.json({ success: true, data: admin });
  } catch (error) {
    res.status(500).json({ message: 'Error updating admin user', error: error.message });
  }
});

// Toggle admin user status
router.patch('/users/:adminId/toggle-status', requirePermission('users', 'write'), async (req, res) => {
  try {
    const { adminId } = req.params;
    const admin = await AdminUser.findById(adminId);
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }
    
    admin.isActive = !admin.isActive;
    await admin.save();
    
    res.json({
      success: true,
      message: `Admin user ${admin.isActive ? 'activated' : 'deactivated'} successfully`,
      data: admin
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling admin status', error: error.message });
  }
});

// Reset admin password
router.post('/users/:adminId/reset-password', requirePermission('users', 'write'), async (req, res) => {
  try {
    const { adminId } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    const admin = await AdminUser.findById(adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }
    
    admin.password = newPassword;
    await admin.save();
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
});

// Delete admin user
router.delete('/users/:adminId', requirePermission('users', 'delete'), async (req, res) => {
  try {
    const { adminId } = req.params;
    
    // Prevent self-deletion
    if (adminId === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }
    
    const admin = await AdminUser.findByIdAndDelete(adminId);
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }
    
    res.json({
      success: true,
      message: 'Admin user deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting admin user', error: error.message });
  }
});

// === AUDIT LOGS ===
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, action, startDate, endDate } = req.query;
    
    const filter = {};
    if (action) filter.action = action;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const logs = await AuditLog.find(filter)
      .populate('performedBy', 'username email profile.firstName profile.lastName')
      .populate('targetUser', 'email profile.firstName profile.lastName')
      .populate('targetOrder', 'friendlyId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await AuditLog.countDocuments(filter);
    
    res.json({
      logs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching audit logs', error: error.message });
  }
});

// Generate sample orders for testing
router.post('/generate-sample-orders', async (req, res) => {
    try {
        const Order = require('../models/Order');
        
        // Create sample orders
        const sampleOrders = [
            {
                friendlyId: 'PW-001',
                client: {
                    phone: '0551234567',
                    location: {
                        addressName: 'Home',
                        coordinates: { lat: 5.6037, lng: -0.1870 }
                    }
                },
                items: [
                    { name: 'Shirt', price: 15, quantity: 2 },
                    { name: 'Trousers', price: 20, quantity: 1 }
                ],
                pricing: {
                    itemsSubtotal: 50,
                    serviceFee: 5,
                    deliveryFee: 10,
                    systemFee: 3,
                    totalAmount: 68
                },
                status: 'delivered', // Valid enum value
                paymentDetails: {
                    reference: 'PURWASH_' + Date.now() + '_1',
                    status: 'success',
                    method: 'mobile_money'
                },
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
            },
            {
                friendlyId: 'PW-002',
                client: {
                    phone: '0559876543',
                    location: {
                        addressName: 'Office',
                        coordinates: { lat: 5.6037, lng: -0.1870 }
                    }
                },
                items: [
                    { name: 'Dress', price: 30, quantity: 1 },
                    { name: 'Suit', price: 50, quantity: 1 }
                ],
                pricing: {
                    itemsSubtotal: 80,
                    serviceFee: 5,
                    deliveryFee: 10,
                    systemFee: 2,
                    totalAmount: 97
                },
                status: 'delivered', // Valid enum value
                paymentDetails: {
                    reference: 'PURWASH_' + Date.now() + '_2',
                    status: 'success',
                    method: 'mobile_money'
                },
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
            },
            {
                friendlyId: 'PW-003',
                client: {
                    phone: '0551234567',
                    location: {
                        addressName: 'Home',
                        coordinates: { lat: 5.6037, lng: -0.1870 }
                    }
                },
                items: [
                    { name: 'Bedding', price: 40, quantity: 1 }
                ],
                pricing: {
                    itemsSubtotal: 40,
                    serviceFee: 5,
                    deliveryFee: 10,
                    systemFee: 1,
                    totalAmount: 56
                },
                status: 'created', // Valid enum value
                paymentDetails: {
                    reference: 'PURWASH_' + Date.now() + '_3',
                    status: 'pending',
                    method: 'mobile_money'
                },
                createdAt: new Date() // Today
            }
        ];
        
        // Insert sample orders
        await Order.insertMany(sampleOrders);
        
        res.json({
            success: true,
            message: 'Sample orders generated successfully',
            data: {
                ordersCreated: sampleOrders.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating sample orders',
            error: error.message
        });
    }
});

// Laundry Items Management
router.get('/laundry-items', async (req, res) => {
    try {
        const LaundryItem = require('../models/LaundryItem');
        const { page = 1, limit = 50, category, serviceType, isActive } = req.query;
        
        const filter = {};
        if (category) filter.category = category;
        if (serviceType) filter.serviceType = serviceType;
        if (isActive !== undefined) filter['availability.isActive'] = isActive === 'true';
        
        const items = await LaundryItem.find(filter)
            .populate('addedBy', 'name email')
            .populate('lastUpdatedBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        const total = await LaundryItem.countDocuments(filter);
        
        res.json({
            success: true,
            data: items,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching laundry items', error: error.message });
    }
});

router.post('/laundry-items', async (req, res) => {
    try {
        const LaundryItem = require('../models/LaundryItem');
        const logAction = require('../utils/auditLogger');
        
        const itemData = {
            ...req.body,
            addedBy: req.user.id,
            slug: req.body.name ? req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'item-' + Date.now()
        };
        
        const item = new LaundryItem(itemData);
        await item.save();
        
        // Log the action (without audit logger for now to avoid issues)
        try {
            await logAction({
                action: 'CREATE_LAUNDRY_ITEM',
                performedBy: req.user.id,
                metadata: {
                    itemId: item._id,
                    itemName: item.name,
                    category: item.category
                },
                req
            });
        } catch (logError) {
            console.error('Audit logging failed:', logError.message);
        }
        
        res.status(201).json({
            success: true,
            message: 'Laundry item created successfully',
            data: item
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating laundry item', error: error.message });
    }
});

router.put('/laundry-items/:id', async (req, res) => {
    try {
        const LaundryItem = require('../models/LaundryItem');
        const logAction = require('../utils/auditLogger');
        
        const item = await LaundryItem.findByIdAndUpdate(
            req.params.id,
            { 
                ...req.body, 
                lastUpdatedBy: req.user.id,
                slug: req.body.name ? req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined
            },
            { new: true, runValidators: true }
        );
        
        if (!item) {
            return res.status(404).json({ message: 'Laundry item not found' });
        }
        
        // Log the action
        await logAction({
            action: 'UPDATE_LAUNDRY_ITEM',
            performedBy: req.user.id,
            metadata: {
                itemId: item._id,
                itemName: item.name,
                category: item.category
            },
            req
        });
        
        res.json({
            success: true,
            message: 'Laundry item updated successfully',
            data: item
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating laundry item', error: error.message });
    }
});

router.delete('/laundry-items/:id', async (req, res) => {
    try {
        const LaundryItem = require('../models/LaundryItem');
        const logAction = require('../utils/auditLogger');
        
        const item = await LaundryItem.findByIdAndDelete(req.params.id);
        
        if (!item) {
            return res.status(404).json({ message: 'Laundry item not found' });
        }
        
        // Log the action
        await logAction({
            action: 'DELETE_LAUNDRY_ITEM',
            performedBy: req.user.id,
            metadata: {
                itemId: item._id,
                itemName: item.name,
                category: item.category
            },
            req
        });
        
        res.json({
            success: true,
            message: 'Laundry item deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting laundry item', error: error.message });
    }
});

// Platform Fees Management
router.get('/config/platform-fees', async (req, res) => {
    try {
        const Config = require('../models/config');
        
        let config = await Config.findOne();
        if (!config) {
            // Create default config if none exists
            config = new Config({
                platformFeePercentage: 9,
                deliveryFee: 10,
                platformPerItemFee: 1,
                minOrderAmount: 5
            });
            await config.save();
        }
        
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching platform fees', error: error.message });
    }
});

router.put('/config/platform-fees', async (req, res) => {
    try {
        const Config = require('../models/config');
        const logAction = require('../utils/auditLogger');
        
        const { platformFeePercentage, deliveryFee, platformPerItemFee, minOrderAmount } = req.body;
        
        let config = await Config.findOne();
        if (!config) {
            config = new Config({});
        }
        
        // Update the platform fees
        config.platformFeePercentage = platformFeePercentage;
        config.deliveryFee = deliveryFee;
        config.platformPerItemFee = platformPerItemFee;
        config.minOrderAmount = minOrderAmount;
        config.updatedBy = req.user.id;
        
        await config.save();
        
        // Log the action
        try {
            await logAction({
                action: 'UPDATE_PLATFORM_FEES',
                performedBy: req.user.id,
                metadata: {
                    platformFeePercentage,
                    deliveryFee,
                    platformPerItemFee,
                    minOrderAmount
                },
                req
            });
        } catch (logError) {
            console.error('Audit logging failed:', logError.message);
        }
        
        res.json({
            success: true,
            message: 'Platform fees updated successfully',
            data: config
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating platform fees', error: error.message });
    }
});

module.exports = router;