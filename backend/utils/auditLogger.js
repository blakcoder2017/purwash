const AuditLog = require('../models/AuditLogs');

/**
 * Logs an admin action for audit trail
 * @param {Object} params - Logging parameters
 * @param {string} params.action - Action type (e.g., 'USER_BAN', 'ORDER_ASSIGN')
 * @param {string} params.performedBy - ID of user who performed the action
 * @param {string} params.targetUser - ID of user the action was performed on (optional)
 * @param {string} params.targetOrder - ID of order related to the action (optional)
 * @param {Object} params.metadata - Additional metadata about the action
 * @param {Object} params.req - Express request object for IP/user agent
 */
const logAction = async ({ action, performedBy, targetUser, targetOrder, metadata, req }) => {
  try {
    const logEntry = new AuditLog({
      action,
      performedBy,
      targetUser,
      targetOrder,
      metadata,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent'),
      timestamp: new Date()
    });

    await logEntry.save();
    console.log(`Audit log created: ${action} by ${performedBy}`);
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error - logging failure shouldn't break the main operation
  }
};

module.exports = logAction;
