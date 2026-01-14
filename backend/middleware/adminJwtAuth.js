const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const admin = await AdminUser.findById(decoded.adminId).select('-password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Admin not found.'
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    if (admin.isLocked) {
      return res.status(401).json({
        success: false,
        message: 'Account is locked. Please try again later.'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    console.error('Admin authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Permission-based middleware
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Super admin has all permissions
    if (req.admin.role === 'super_admin') {
      return next();
    }

    // Check specific permission
    const permission = req.admin.permissions[resource];
    
    if (!permission) {
      return res.status(403).json({
        success: false,
        message: `No permissions configured for ${resource}.`
      });
    }

    if (!permission[action]) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. Required: ${action} on ${resource}.`
      });
    }

    next();
  };
};

// Role-based middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}.`
      });
    }

    next();
  };
};

module.exports = {
  authenticateAdmin,
  requirePermission,
  requireRole
};
