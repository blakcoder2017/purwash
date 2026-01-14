const AdminUser = require('../models/AdminUser');
const Order = require('../models/Order');
const User = require('../models/User');
const Client = require('../models/Client');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (adminId) => {
  return jwt.sign({ adminId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '24h'
  });
};

// Dashboard methods
const getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'created' });
    const activeRiders = await User.countDocuments({ role: 'rider', isActive: true });
  
    const activePartners = await User.countDocuments({ role: 'partner', isActive: true });
    
    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('client', 'phone')
      .populate('laundry', 'businessName')
      .populate('rider', 'profile.firstName profile.lastName');

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        activeRiders,
        activePartners,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get dashboard stats'
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('client', 'phone')
      .populate('laundry', 'businessName')
      .populate('rider', 'profile.firstName profile.lastName');

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get orders'
    });
  }
};


const getPartners = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const partners = await User.find({ role: 'partner' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password');

    const total = await User.countDocuments({ role: 'partner' });

    res.json({
      success: true,
      data: {
        partners,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get partners error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get partners'
    });
  }
};

const getRiders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const riders = await User.find({ role: 'rider' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password');

    const total = await User.countDocuments({ role: 'rider' });

    res.json({
      success: true,
      data: {
        riders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get riders error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get riders'
    });
  }
};

// Register Admin User
const registerAdmin = async (req, res) => {
  try {
    const { username, email, password, role, permissions, profile } = req.body;
    const createdBy = req.admin ? req.admin.id : null;

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

    // Create new admin
    const admin = new AdminUser({
      username,
      email,
      password,
      role: role || 'admin',
      permissions: permissions || {},
      profile: profile || {},
      createdBy
    });

    await admin.save();

    // Log activity
    await admin.logActivity('create', 'admin_user', admin._id, { username, email, role }, req);

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          profile: admin.profile,
          isActive: admin.isActive,
          createdAt: admin.createdAt
        },
        token: generateToken(admin._id)
      }
    });
  } catch (error) {
    console.error('Register admin error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to register admin'
    });
  }
};

// Login Admin
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin by credentials
    const admin = await AdminUser.findByCredentials(email, password);

    // Log activity
    await admin.logActivity('login', 'admin_user', admin._id, {}, req);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          profile: admin.profile,
          lastLogin: admin.lastLogin
        },
        token: generateToken(admin._id)
      }
    });
  } catch (error) {
    console.error('Login admin error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

// Get All Admin Users
const getAdminUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, isActive } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const admins = await AdminUser.find(query)
      .select('-password')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdminUser.countDocuments(query);

    res.json({
      success: true,
      data: {
        admins,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get admin users'
    });
  }
};

// Get Single Admin User
const getAdminUser = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await AdminUser.findById(adminId)
      .select('-password')
      .populate('createdBy', 'username email');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    res.json({
      success: true,
      data: { admin }
    });
  } catch (error) {
    console.error('Get admin user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get admin user'
    });
  }
};

// Update Admin User
const updateAdminUser = async (req, res) => {
  try {
    const { adminId } = req.params;
    const updates = req.body;

    // Don't allow password update through this endpoint
    delete updates.password;

    const admin = await AdminUser.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Update admin
    Object.assign(admin, updates);
    await admin.save();

    // Log activity
    await admin.logActivity('update', 'admin_user', admin._id, updates, req);

    res.json({
      success: true,
      message: 'Admin user updated successfully',
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          profile: admin.profile,
          isActive: admin.isActive,
          updatedAt: admin.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update admin user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update admin user'
    });
  }
};

// Delete Admin User
const deleteAdminUser = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await AdminUser.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Don't allow deletion of self
    if (admin._id.toString() === req.admin.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Don't allow deletion of super admin
    if (admin.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete super admin account'
      });
    }

    await AdminUser.findByIdAndDelete(adminId);

    // Log activity
    await req.admin.logActivity('delete', 'admin_user', adminId, { username: admin.username }, req);

    res.json({
      success: true,
      message: 'Admin user deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete admin user'
    });
  }
};

// Toggle Admin Status
const toggleAdminStatus = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await AdminUser.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Don't allow deactivation of self
    if (admin._id.toString() === req.admin.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    // Don't allow deactivation of super admin
    if (admin.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate super admin account'
      });
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    // Log activity
    await admin.logActivity('toggle_status', 'admin_user', admin._id, { isActive: admin.isActive }, req);

    res.json({
      success: true,
      message: `Admin user ${admin.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          isActive: admin.isActive
        }
      }
    });
  } catch (error) {
    console.error('Toggle admin status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle admin status'
    });
  }
};

// Reset Admin Password
const resetAdminPassword = async (req, res) => {
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
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    admin.password = newPassword;
    await admin.save();

    // Log activity
    await admin.logActivity('reset_password', 'admin_user', admin._id, {}, req);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset admin password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password'
    });
  }
};

// Get Admin Activity Log
const getAdminActivityLog = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const admin = await AdminUser.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    const activities = admin.activityLog
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(skip, skip + parseInt(limit));

    const total = admin.activityLog.length;

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin activity log error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get activity log'
    });
  }
};

// Get Current Admin Profile
const getCurrentAdmin = async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.admin.id)
      .select('-password')
      .populate('createdBy', 'username email');

    res.json({
      success: true,
      data: { admin }
    });
  } catch (error) {
    console.error('Get current admin error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get admin profile'
    });
  }
};

// Update Current Admin Profile
const updateCurrentAdmin = async (req, res) => {
  try {
    const updates = req.body;
    
    // Don't allow role or permissions update through this endpoint
    delete updates.role;
    delete updates.permissions;
    delete updates.isActive;

    const admin = await AdminUser.findById(req.admin.id);
    
    // Update profile
    if (updates.profile) {
      Object.assign(admin.profile, updates.profile);
    }
    
    if (updates.username) admin.username = updates.username;
    if (updates.email) admin.email = updates.email;

    await admin.save();

    // Log activity
    await admin.logActivity('update_profile', 'admin_user', admin._id, updates, req);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          profile: admin.profile
        }
      }
    });
  } catch (error) {
    console.error('Update current admin error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
};

module.exports = {
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
};
