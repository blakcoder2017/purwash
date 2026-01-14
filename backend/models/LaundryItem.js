const mongoose = require('mongoose');

/**
 * Laundry Item Schema - Client-Facing Pricing Catalog
 * 
 * This schema defines the laundry items and services that customers see and order.
 * Prices include embedded system fees (₵1 per item) for clean customer experience.
 */
const LaundryItemSchema = new mongoose.Schema({
  // 1. Basic Item Information
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 500
  },
  
  // 2. Client-Facing Pricing (Includes embedded fees)
  pricing: {
    // Price customers see (includes embedded ₵1 system fee)
    clientPrice: { 
      type: Number, 
      required: true,
      min: 1,
      validate: {
        validator: function(v) {
          return v >= 1; // Minimum ₵1 to ensure valid pricing
        },
        message: 'Client price must be at least ₵1'
      }
    },
    
    // Internal breakdown (not shown to clients)
    basePrice: { 
      type: Number, 
      required: true,
      min: 0,
      validate: {
        validator: function(v) {
          return this.pricing.clientPrice >= v + 1; // Ensure client price covers base + system fee
        },
        message: 'Client price must be at least base price + ₵1 system fee'
      }
    },
    
    // System fee embedded in client price (typically ₵1)
    embeddedSystemFee: { 
      type: Number, 
      default: 1,
      min: 0
    }
  },
  
  // 3. Item Classification
  category: { 
    type: String, 
    required: true,
    enum: [
      'clothing',      // Shirts, trousers, dresses
      'bedding',       // Sheets, blankets, pillows
      'specialty',     // Suits, delicate fabrics
      'household',     // Curtains, towels, rugs
      'accessories'    // Bags, shoes, hats
    ],
    index: true
  },
  
  // 4. Service Type
  serviceType: {
    type: String,
    required: true,
    enum: [
      'wash_and_fold',    // Regular washing
      'wash_and_iron',    // Washing + ironing
      'dry_clean',        // Dry cleaning
      'iron_only',        // Just ironing
      'special_treatment'  // Stain removal, etc.
    ],
    index: true
  },
  
  // 5. Item Specifications
  specifications: {
    // Size categories for pricing variations
    size: {
      type: String,
      enum: ['small', 'medium', 'large', 'extra_large'],
      default: 'medium'
    },
    
    // Fabric type requirements
    fabricType: {
      type: String,
      enum: ['cotton', 'polyester', 'wool', 'silk', 'linen', 'mixed', 'any'],
      default: 'any'
    },
    
    // Weight in kg (for heavy items)
    weightKg: {
      type: Number,
      min: 0,
      max: 50,
      default: 1
    },
    
    // Special handling requirements
    specialHandling: [{
      type: String,
      enum: [
        'delicate',
        'color_separate',
        'hand_wash_only',
        'no_iron',
        'low_heat',
        'eco_friendly'
      ]
    }]
  },
  
  // 6. Availability and Status
  availability: {
    isActive: { 
      type: Boolean, 
      default: true,
      index: true
    },
    
    // Seasonal availability
    seasonalAvailability: {
      isSeasonal: { type: Boolean, default: false },
      availableMonths: [{
        type: Number,
        min: 1,
        max: 12
      }]
    },
    
    // Location-based availability
    locationRestrictions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location'
    }]
  },
  
  // 7. Visual Assets
  images: [{
    url: { type: String, required: true },
    alt: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
    order: { type: Number, default: 0 }
  }],
  
  // 8. Business Logic
  // Estimated processing time in hours
  estimatedProcessingHours: {
    type: Number,
    required: true,
    min: 1,
    max: 168, // Max 1 week
    default: 24
  },
  
  // Minimum order quantity
  minimumQuantity: {
    type: Number,
    min: 1,
    default: 1
  },
  
  // Popular items flag for featured display
  isPopular: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // 9. Metadata and Tracking
  addedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AdminUser',
    required: true
  },
  
  lastUpdatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AdminUser'
  },
  
  // Tags for search and filtering
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 50
  }],
  
  // SEO and display
  slug: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
    maxlength: 100
  }
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Hide internal pricing breakdown from clients
      delete ret.pricing.basePrice;
      delete ret.pricing.embeddedSystemFee;
      return ret;
    }
  }
});

// Indexes for performance
LaundryItemSchema.index({ category: 1, serviceType: 1 });
LaundryItemSchema.index({ 'pricing.clientPrice': 1 });
LaundryItemSchema.index({ availability: 1, isPopular: 1 });
LaundryItemSchema.index({ tags: 1 });

// Virtual for display price formatting
LaundryItemSchema.virtual('formattedPrice').get(function() {
  return `₵${this.pricing.clientPrice.toFixed(2)}`;
});

// Pre-save middleware for slug generation - DISABLED
// LaundryItemSchema.pre('save', function(next) {
//   if (this.isModified('name') && !this.slug) {
//     this.slug = this.name
//       .toLowerCase()
//       .replace(/[^a-z0-9]+/g, '-')
//       .replace(/(^-|-$)/g, '');
//   }
//   if (next) next();
// });

// Validation middleware - DISABLED
// LaundryItemSchema.pre('save', function(next) {
//   // Ensure client price covers base price + system fee
//   if (this.pricing && this.pricing.basePrice && this.pricing.embeddedSystemFee && this.pricing.clientPrice) {
//     const requiredMinPrice = this.pricing.basePrice + this.pricing.embeddedSystemFee;
//     if (this.pricing.clientPrice < requiredMinPrice) {
//       if (next) return next(new Error(`Client price must be at least ₵${requiredMinPrice.toFixed(2)} (base: ₵${this.pricing.basePrice.toFixed(2)} + system fee: ₵${this.pricing.embeddedSystemFee.toFixed(2)})`));
//     }
//   }
//   if (next) next();
// });

module.exports = mongoose.model('LaundryItem', LaundryItemSchema);
