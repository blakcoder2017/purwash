const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: { 
    type: String, 
    required: true,
    enum: [
      'ORDER_STATUS_CHANGE', 'ORDER_ASSIGNMENT', 'ORDER_FORCE_CONFIRM', 'ORDER_CANCELLATION',
      'USER_BAN', 'USER_UNBAN', 
      'CLIENT_UPDATE', 'CLIENT_SUSPEND', 'CLIENT_UNSUSPEND', 'CLIENT_DELETE', 'CLIENT_NOTE_ADDED',
      'RIDER_UPDATE', 'RIDER_SUSPEND', 'RIDER_ACTIVATE', 'RIDER_DELETE', 'RIDER_NOTE_ADDED', 'RIDER_WALLET_ADJUSTMENT',
      'PARTNER_UPDATE', 'PARTNER_SUSPEND', 'PARTNER_ACTIVATE', 'PARTNER_DELETE', 'PARTNER_NOTE_ADDED', 'PARTNER_WALLET_ADJUSTMENT', 'PARTNER_MOMO_VERIFY', 'PARTNER_MOMO_UNVERIFY',
      'PAYMENT_SPLIT', 'PRICE_CONFIG_UPDATE'
    ] 
  },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' }, // Can be null for system/cron actions
  targetOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: Object, // Stores { oldStatus: '...', newStatus: '...', reason: '...', etc. }
  ipAddress: String,
  userAgent: String
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);