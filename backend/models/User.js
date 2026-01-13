const mongoose = require('mongoose');
const { hashPassword } = require('../utils/password');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['client', 'admin', 'rider', 'partner'],
    default: 'client'
  },
  profile: {
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    avatar: {
      type: String
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  
  // Rider/Partner specific fields
  businessName: String,
  location: {
    address: String,
    lat: Number,
    lng: Number
  },
  momo: {
    number: { type: String },
    network: { type: String, enum: ['mtn', 'vod', 'atl'] },
    resolvedName: String,
    isVerified: { type: Boolean, default: false }
  },
  
  // Paystack Integration Codes
  paystack: {
    subaccountCode: String,
    recipientCode: String
  },

  // Read-only Wallet for UI
  wallet: {
    totalEarned: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 }
  },
  
  isOnline: { type: Boolean, default: false },
  bio: String,
  profilePicture: String,
  operatingHours: {
    open: { type: String, default: "08:00" },
    close: { type: String, default: "18:00" }
  },
  accountStatus: { 
    type: String, 
    enum: ['active', 'suspended', 'banned'], 
    default: 'active' 
  },
  banReason: String,
  strikeCount: { type: Number, default: 0 },
  
  // Client specific fields
  addresses: [{
    addressName: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }]
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await hashPassword(this.password);
    next();
  } catch (error) {
    next(error);
  }
});

// Remove password from JSON output
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Get full name
UserSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.profile.firstName || this.email;
});

module.exports = mongoose.model('User', UserSchema);