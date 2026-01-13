const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */
const authenticateToken = (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
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
 * Role-based Authorization Middleware
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

/**
 * Optional Authentication Middleware
 * Attaches user info if token is present, but doesn't require it
 */
const optionalAuth = (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req);
    
    if (token) {
      const decoded = verifyToken(token);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  optionalAuth
};
