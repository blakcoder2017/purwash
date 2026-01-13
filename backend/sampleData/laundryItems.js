/**
 * Sample Laundry Items Data
 * 
 * This file contains sample data for the laundry catalog
 * with embedded fee pricing model
 */

const sampleItems = [
  {
    name: "Regular Shirt",
    description: "Cotton shirt with standard washing and folding",
    pricing: {
      clientPrice: 5.00,  // What customer sees
      basePrice: 4.00,    // Internal base price
      embeddedSystemFee: 1.00  // Embedded system fee
    },
    category: "clothing",
    serviceType: "wash_and_fold",
    specifications: {
      size: "medium",
      fabricType: "cotton",
      weightKg: 0.5,
      specialHandling: []
    },
    availability: {
      isActive: true,
      seasonalAvailability: {
        isSeasonal: false
      }
    },
    images: [
      {
        url: "/images/shirt.jpg",
        alt: "Regular shirt",
        isPrimary: true,
        order: 0
      }
    ],
    estimatedProcessingHours: 24,
    minimumQuantity: 1,
    isPopular: true,
    tags: ["shirt", "cotton", "regular", "wash"],
    slug: "regular-shirt"
  },
  {
    name: "Business Suit",
    description: "Professional suit with dry cleaning service",
    pricing: {
      clientPrice: 25.00,
      basePrice: 24.00,
      embeddedSystemFee: 1.00
    },
    category: "specialty",
    serviceType: "dry_clean",
    specifications: {
      size: "medium",
      fabricType: "mixed",
      weightKg: 2.0,
      specialHandling: ["delicate", "no_iron"]
    },
    availability: {
      isActive: true,
      seasonalAvailability: {
        isSeasonal: false
      }
    },
    images: [
      {
        url: "/images/suit.jpg",
        alt: "Business suit",
        isPrimary: true,
        order: 0
      }
    ],
    estimatedProcessingHours: 48,
    minimumQuantity: 1,
    isPopular: false,
    tags: ["suit", "business", "dry_clean", "professional"],
    slug: "business-suit"
  },
  {
    name: "Bed Sheet Set",
    description: "Complete bed sheet set (fitted, flat, pillowcases)",
    pricing: {
      clientPrice: 15.00,
      basePrice: 14.00,
      embeddedSystemFee: 1.00
    },
    category: "bedding",
    serviceType: "wash_and_iron",
    specifications: {
      size: "large",
      fabricType: "cotton",
      weightKg: 3.0,
      specialHandling: ["color_separate"]
    },
    availability: {
      isActive: true,
      seasonalAvailability: {
        isSeasonal: false
      }
    },
    images: [
      {
        url: "/images/bedsheet.jpg",
        alt: "Bed sheet set",
        isPrimary: true,
        order: 0
      }
    ],
    estimatedProcessingHours: 36,
    minimumQuantity: 1,
    isPopular: true,
    tags: ["bedding", "sheets", "iron", "cotton"],
    slug: "bed-sheet-set"
  },
  {
    name: "T-Shirt Pack",
    description: "Pack of 5 cotton t-shirts",
    pricing: {
      clientPrice: 20.00,
      basePrice: 15.00,
      embeddedSystemFee: 5.00  // ₵1 per item × 5 items
    },
    category: "clothing",
    serviceType: "wash_and_fold",
    specifications: {
      size: "medium",
      fabricType: "cotton",
      weightKg: 1.5,
      specialHandling: []
    },
    availability: {
      isActive: true,
      seasonalAvailability: {
        isSeasonal: false
      }
    },
    images: [
      {
        url: "/images/tshirts.jpg",
        alt: "T-shirt pack",
        isPrimary: true,
        order: 0
      }
    ],
    estimatedProcessingHours: 24,
    minimumQuantity: 1,
    isPopular: true,
    tags: ["tshirt", "cotton", "pack", "casual"],
    slug: "tshirt-pack"
  },
  {
    name: "Delicate Dress",
    description: "Delicate fabric dress with special care washing",
    pricing: {
      clientPrice: 18.00,
      basePrice: 17.00,
      embeddedSystemFee: 1.00
    },
    category: "specialty",
    serviceType: "wash_and_fold",
    specifications: {
      size: "medium",
      fabricType: "silk",
      weightKg: 0.8,
      specialHandling: ["delicate", "hand_wash_only", "no_iron"]
    },
    availability: {
      isActive: true,
      seasonalAvailability: {
        isSeasonal: false
      }
    },
    images: [
      {
        url: "/images/dress.jpg",
        alt: "Delicate dress",
        isPrimary: true,
        order: 0
      }
    ],
    estimatedProcessingHours: 48,
    minimumQuantity: 1,
    isPopular: false,
    tags: ["dress", "delicate", "silk", "special_care"],
    slug: "delicate-dress"
  },
  {
    name: "Curtain Set",
    description: "Living room curtain set with ironing",
    pricing: {
      clientPrice: 35.00,
      basePrice: 34.00,
      embeddedSystemFee: 1.00
    },
    category: "household",
    serviceType: "wash_and_iron",
    specifications: {
      size: "extra_large",
      fabricType: "polyester",
      weightKg: 5.0,
      specialHandling: ["low_heat"]
    },
    availability: {
      isActive: true,
      seasonalAvailability: {
        isSeasonal: false
      }
    },
    images: [
      {
        url: "/images/curtains.jpg",
        alt: "Curtain set",
        isPrimary: true,
        order: 0
      }
    ],
    estimatedProcessingHours: 72,
    minimumQuantity: 1,
    isPopular: false,
    tags: ["curtains", "household", "iron", "polyester"],
    slug: "curtain-set"
  }
];

module.exports = sampleItems;
