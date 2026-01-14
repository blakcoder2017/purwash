const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
  // Platform Fees - matching the pricing breakdown
  platformFeePercentage: { type: Number, default: 9, min: 0, max: 100 }, // Platform Fee (% of base cost)
  deliveryFee: { type: Number, default: 10, min: 0 }, // Delivery Fee (GHS)
  platformPerItemFee: { type: Number, default: 1, min: 0 }, // Platform Commission per item (GHS)
  minOrderAmount: { type: Number, default: 5, min: 0 }, // Minimum order amount (GHS)
  
  // Metadata
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' }
}, { timestamps: true });

module.exports = mongoose.model('Config', ConfigSchema);