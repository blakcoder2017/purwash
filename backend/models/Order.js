const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  // 1. Identification & Tracking
  friendlyId: { 
    type: String, 
    unique: true, 
    index: true,
    required: true 
  },
  
  // 2. Client Information (Anonymous/Ghost Identity)
  client: {
    phone: { type: String, required: true },
    location: {
      addressName: String, // Text description (e.g., "Near Tamale Teaching Hospital")
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
      }
    }
  },

  // 3. Order Composition
  items: [{
    name: String,
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 }
  }],

  // 4. Robust Pricing (Calculated in GHS)
  pricing: {
    itemsSubtotal: Number,
    serviceFee: Number,    // The 9% fee
    deliveryFee: Number,   // The ₵10 fee
    systemFee: Number,     // The ₵1 per item fee
    totalAmount: Number    // Final amount sent to Paystack
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
      'delivered'             // Completed
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
    channel: String, // 'mobile_money' or 'card'
    paidAt: Date
  },

  // 8. Automation & Safety Flags
  isConfirmedByClient: { type: Boolean, default: false },
  isAdminConfirmed: { type: Boolean, default: false },
  isDisbursed: { type: Boolean, default: false } // Has Paystack split been triggered?

}, { 
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Middleware: Prevent accidental modification of the friendlyId
OrderSchema.pre('save', function(next) {
  if (this.isNew && !this.friendlyId) {
    // Note: Generation logic should ideally happen in the Controller 
    // to handle collision retries, but we keep this as a fallback.
    this.friendlyId = Math.floor(100000 + Math.random() * 900000).toString();
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);