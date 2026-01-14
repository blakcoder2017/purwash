const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const AdminUser = require('../models/AdminUser');

/**
 * Admin Authentication Middleware
 * Verifies JWT token and ensures user is a valid admin
 */
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = verifyToken(token);
    
    // Verify that the user is a valid admin
    const admin = await AdminUser.findById(decoded.id);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid admin credentials' 
      });
    }
    
    // Attach admin info to request
    req.user = {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: 'Authentication error' 
      });
    }
  }
};

/**
 * Admin Permission Middleware
 * Checks if admin has specific permission
 * @param {string} resource - Resource type (orders, users, partners, etc.)
 * @param {string} action - Action type (read, write, delete)
 */
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const permissions = req.user.permissions;
    
    // Super admin has all permissions
    if (req.user.role === 'super_admin') {
      return next();
    }
    
    // Check specific permission
    if (!permissions[resource] || !permissions[resource][action]) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

module.exports = {
  authenticateAdmin,
  requirePermission
};