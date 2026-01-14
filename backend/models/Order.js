const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  // 1. Identification & Tracking
  friendlyId: { 
    type: String, 
    unique: true, 
    index: true,
    required: true 
  },
  
  // 2. Client Information (Shadow Account Compatible)
  client: {
    // Reference to Client document (when available)
    clientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Client',
      sparse: true // Allows null for guest orders
    },
    
    // Always store phone for shadow account compatibility
    phone: { 
      type: String, 
      required: true,
      index: true // For phone-based lookups
    },
    
    // Client name at time of order (in case client updates name later)
    clientName: {
      type: String,
      required: true
    },
    
    // Delivery location for this specific order
    location: {
      addressName: { type: String, required: true }, // Text description
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
      }
    }
  },

  // 3. Order Composition
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 }
  }],

  // 4. Robust Pricing (Calculated from Config)
  pricing: {
    itemsSubtotal: { type: Number, required: true },
    serviceFee: { type: Number, required: true },    // Platform commission %
    deliveryFee: { type: Number, required: true },   // Fixed delivery fee
    systemFee: { type: Number, required: true },     // Per-item system fee
    totalAmount: { type: Number, required: true }     // Final amount sent to Paystack
  },

  // 5. Workflow Status
  status: {
    type: String,
    enum: [
      'created',              // Client submitted
      'assigned',             // Admin assigned Rider/Laundry
      'on_my_way_to_pick',    // Rider moving to Client
      'picked_up',            // Rider has the clothes
      'dropped_at_laundry',   // Rider handed over to Laundry
      'washing',              // Laundry processing
      'ready_for_pick',       // Laundry done
      'out_for_delivery',     // Rider moving to Client for drop-off
      'delivered',            // Completed
      'cancelled'             // Order cancelled
    ],
    default: 'created'
  },

  // 6. Stakeholders
  rider: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  laundry: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },

  // 7. Payment & Paystack Integration
  paymentDetails: {
    reference: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    },
    status: { 
      type: String, 
      enum: ['pending', 'success', 'failed', 'abandoned'], 
      default: 'pending' 
    },
    channel: { type: String, enum: ['mobile_money', 'card'] },
    paidAt: Date
  },

  // 8. Automation & Safety Flags
  isConfirmedByClient: { type: Boolean, default: false },
  isAdminConfirmed: { type: Boolean, default: false },
  isDisbursed: { type: Boolean, default: false }, // Has Paystack split been triggered?
  
  // 9. Shadow Account Specific Fields
  isGuestOrder: {
    type: Boolean,
    default: true // All orders start as guest orders
  },
  convertedToClientOrder: {
    type: Boolean,
    default: false // Set to true when linked to client account
  },
  
  // 10. Admin fields
  adminNotes: { type: String },
  cancellationReason: { type: String },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  cancelledAt: { type: Date }

}, { 
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Middleware: Prevent accidental modification of the friendlyId - DISABLED
// OrderSchema.pre('save', function(next) {
//   if (this.isModified('friendlyId') && !this.isNew) {
//     return next(new Error('Cannot modify friendlyId after creation'));
//   }
//   next();
// });

// Static method to find orders by phone number (for shadow account tracking)
OrderSchema.statics.findByPhone = function(phone) {
  return this.find({ 'client.phone': phone }).sort({ createdAt: -1 });
};

// Static method to link order to client account
OrderSchema.statics.linkToClient = async function(orderId, clientId) {
  return this.findByIdAndUpdate(orderId, {
    'client.clientId': clientId,
    convertedToClientOrder: true,
    isGuestOrder: false
  }, { new: true });
};

// Virtual for order age in hours
OrderSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

// Index for efficient phone-based queries
OrderSchema.index({ 'client.phone': 1, createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);