const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Client Model - Auto-onboarding Strategy
 * 
 * This model represents customers who are automatically onboarded
 * when they place their first order using their phone number.
 * No manual registration required - accounts are created seamlessly.
 */
const clientSchema = new Schema({
  // Primary identifier - unique phone number
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },

  // Client's display name
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  // Email (optional for future use)
  email: {
    type: String,
    sparse: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  // Saved pickup/delivery locations
  savedLocations: [{
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Order statistics
  totalOrders: {
    type: Number,
    default: 0,
    min: 0
  },

  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },

  // Last order date for analytics
  lastOrderDate: {
    type: Date
  },

  // Client status
  isActive: {
    type: Boolean,
    default: true
  },

  // Preferences
  preferences: {
    preferredServiceType: {
      type: String,
      enum: ['wash_and_fold', 'wash_and_iron', 'special_treatment']
    },
    preferredBagSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    },
    notifications: {
      sms: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: true }
    }
  },

  // Notes for customer service
  notes: [{
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    addedBy: {
      type: String, // Admin name or system
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
clientSchema.index({ phone: 1 });
clientSchema.index({ isActive: 1 });
clientSchema.index({ createdAt: -1 });
clientSchema.index({ totalOrders: -1 });

// Virtual for average order value
clientSchema.virtual('averageOrderValue').get(function() {
  if (this.totalOrders === 0) return 0;
  return this.totalSpent / this.totalOrders;
});

// Static method to find or create client by phone
clientSchema.statics.findOrCreateByPhone = async function(phone, name) {
  try {
    // First try to find existing client
    let client = await this.findOne({ phone });
    
    if (client) {
      // Update name if different
      if (name && client.name !== name) {
        client.name = name;
        await client.save();
      }
      return client;
    }
    
    // Create new client if not found
    client = new this({
      phone,
      name: name || 'Customer'
    });
    
    await client.save();
    return client;
    
  } catch (error) {
    throw new Error(`Failed to find or create client: ${error.message}`);
  }
};

// Instance method to update order statistics
clientSchema.methods.updateOrderStats = async function(orderAmount) {
  this.totalOrders += 1;
  this.totalSpent += orderAmount;
  this.lastOrderDate = new Date();
  return this.save();
};

// Instance method to add saved location
clientSchema.methods.addSavedLocation = function(locationData) {
  // If this is set as default, remove default from other locations
  if (locationData.isDefault) {
    this.savedLocations.forEach(loc => {
      loc.isDefault = false;
    });
  }
  
  this.savedLocations.push(locationData);
  return this.save();
};

// Instance method to get default location
clientSchema.methods.getDefaultLocation = function() {
  return this.savedLocations.find(loc => loc.isDefault);
};

// Pre-save middleware to ensure only one default location
clientSchema.pre('save', function(next) {
  const defaultLocations = this.savedLocations.filter(loc => loc.isDefault);
  if (defaultLocations.length > 1) {
    // Keep only the first one as default
    this.savedLocations.forEach((loc, index) => {
      if (index > 0 && loc.isDefault) {
        loc.isDefault = false;
      }
    });
  }
  next();
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
