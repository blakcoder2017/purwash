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
  vehicleType: {
    type: String,
    enum: ['motorcycle', 'bicycle', 'car', 'Keke'],
    default: 'motorcycle'
  },
  vehicleNumber: String,
  momo: {
    number: { type: String },
    network: { type: String, enum: ['mtn', 'vod', 'atl'], default: null },
    resolvedName: String,
    isVerified: { type: Boolean, default: false }
  },
  
  // Paystack Integration Codes
  paystack: {
    subaccountCode: String,
    recipientCode: String
  },

  // Emergency contact for riders
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
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
  
  // Admin notes
  notes: [{
    content: { type: String, required: true },
    type: { type: String, enum: ['general', 'warning', 'complaint', 'praise'], default: 'general' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Soft delete fields
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  
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
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  try {
    this.password = await hashPassword(this.password);
  } catch (error) {
    throw error;
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

// Calculate profile completeness percentage
UserSchema.methods.getProfileCompleteness = function() {
  let requiredFields = 0;
  let completedFields = 0;
  
  // Basic profile fields
  const basicFields = ['firstName', 'lastName', 'phone'];
  basicFields.forEach(field => {
    requiredFields++;
    if (this.profile[field] && this.profile[field].trim() !== '') {
      completedFields++;
    }
  });
  
  // Role-specific fields
  if (this.role === 'rider' || this.role === 'partner') {
    const riderPartnerFields = ['businessName', 'bio', 'location.address'];
    riderPartnerFields.forEach(field => {
      requiredFields++;
      const fieldPath = field.split('.');
      let value = this;
      for (const part of fieldPath) {
        value = value?.[part];
      }
      if (value && value.trim() !== '') {
        completedFields++;
      }
    });
    
    // Rider-specific fields
    if (this.role === 'rider') {
      const riderFields = ['vehicleType', 'vehicleNumber'];
      riderFields.forEach(field => {
        requiredFields++;
        if (this[field] && this[field].toString().trim() !== '') {
          completedFields++;
        }
      });
      
      // Emergency contact
      requiredFields++;
      if (this.emergencyContact && 
          this.emergencyContact.name && 
          this.emergencyContact.phone && 
          this.emergencyContact.relationship &&
          this.emergencyContact.name.trim() !== '' &&
          this.emergencyContact.phone.trim() !== '' &&
          this.emergencyContact.relationship.trim() !== '') {
        completedFields++;
      }
    }
    
    // MoMo verification
    requiredFields++;
    if (this.momo.isVerified) {
      completedFields++;
    }
    
    // Profile picture
    requiredFields++;
    if (this.profilePicture && this.profilePicture.trim() !== '') {
      completedFields++;
    }
  }
  
  // Client specific fields
  if (this.role === 'client') {
    requiredFields++;
    if (this.addresses && this.addresses.length > 0) {
      completedFields++;
    }
  }
  
  return Math.round((completedFields / requiredFields) * 100);
};

// Get missing fields for profile completion
UserSchema.methods.getMissingFields = function() {
  const missing = [];
  
  // Basic profile fields
  const basicFields = {
    'firstName': this.profile.firstName,
    'lastName': this.profile.lastName,
    'phone': this.profile.phone
  };
  
  Object.entries(basicFields).forEach(([field, value]) => {
    if (!value || value.trim() === '') {
      missing.push({ field, category: 'basic', displayName: field.charAt(0).toUpperCase() + field.slice(1) });
    }
  });
  
  // Role-specific fields
  if (this.role === 'rider' || this.role === 'partner') {
    const riderPartnerFields = {
      'businessName': this.businessName,
      'bio': this.bio,
      'address': this.location?.address
    };
    
    Object.entries(riderPartnerFields).forEach(([field, value]) => {
      if (!value || value.trim() === '') {
        missing.push({ field, category: 'business', displayName: field.charAt(0).toUpperCase() + field.replace(/([A-Z])/g, ' $1').trim() });
      }
    });
    
    // Rider-specific missing fields
    if (this.role === 'rider') {
      if (!this.vehicleType) {
        missing.push({ field: 'vehicleType', category: 'business', displayName: 'Vehicle Type' });
      }
      if (!this.vehicleNumber || this.vehicleNumber.trim() === '') {
        missing.push({ field: 'vehicleNumber', category: 'business', displayName: 'Vehicle Number' });
      }
      
      // Emergency contact
      if (!this.emergencyContact || 
          !this.emergencyContact.name || 
          !this.emergencyContact.phone || 
          !this.emergencyContact.relationship ||
          this.emergencyContact.name.trim() === '' ||
          this.emergencyContact.phone.trim() === '' ||
          this.emergencyContact.relationship.trim() === '') {
        missing.push({ field: 'emergencyContact', category: 'safety', displayName: 'Emergency Contact' });
      }
    }
    
    // MoMo verification
    if (!this.momo.isVerified) {
      missing.push({ field: 'momo', category: 'payment', displayName: 'MoMo Verification' });
    }
  }
  
  // Client specific fields
  if (this.role === 'client') {
    if (!this.addresses || this.addresses.length === 0) {
      missing.push({ field: 'addresses', category: 'delivery', displayName: 'Delivery Address' });
    }
  }
  
  return missing;
};

module.exports = mongoose.model('User', UserSchema);