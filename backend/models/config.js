const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
  serviceFeePercent: { type: Number, default: 9 },
  deliveryFeeFlat: { type: Number, default: 10 },
  systemPerItemFee: { type: Number, default: 1 },
  minOrderAmount: { type: Number, default: 5 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Config', ConfigSchema);