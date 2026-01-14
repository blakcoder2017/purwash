// models/Earning.js
const mongoose = require('mongoose');

const EarningsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wallet: {
    totalEarned: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 }
  },
  transactions: [{
    type: { type: String, enum: ['earning', 'bonus', 'deduction'], required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Earnings', EarningsSchema);