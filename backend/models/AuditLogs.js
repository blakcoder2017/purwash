const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: { 
    type: String, 
    required: true, 
    enum: ['ORDER_STATUS_CHANGE', 'USER_BAN', 'PAYMENT_SPLIT', 'ADMIN_FORCE_CONFIRM', 'PRICE_CONFIG_UPDATE'] 
  },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }, // Can be null for system/cron actions
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: Object, // Stores { oldStatus: '...', newStatus: '...' }
  ipAddress: String
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);