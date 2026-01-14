const mongoose = require('mongoose');
const LaundryItem = require('../models/LaundryItem');

/**
 * Seed Laundry Catalog
 * Populates the database with the provided laundry items and prices
 */

const catalogItems = [
  // Clothing
  {
    name: 'T-shirt',
    category: 'clothing',
    serviceType: 'wash_and_fold',
    description: 'T-shirt washing service',
    pricing: {
      clientPrice: 4,
      basePrice: 3, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    isPopular: true,
    tags: ['casual', 'everyday', 'cotton'],
    estimatedProcessingHours: 12
  },
  {
    name: 'T-shirt',
    category: 'clothing',
    serviceType: 'wash_and_iron',
    description: 'T-shirt wash & iron service',
    pricing: {
      clientPrice: 6,
      basePrice: 5, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    isPopular: true,
    tags: ['casual', 'everyday', 'cotton', 'ironed'],
    estimatedProcessingHours: 18
  },
  {
    name: 'Jeans/Trousers',
    category: 'clothing',
    serviceType: 'wash_and_fold',
    description: 'Jeans/trousers washing service',
    pricing: {
      clientPrice: 5,
      basePrice: 4, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    isPopular: true,
    tags: ['casual', 'denim', 'pants'],
    estimatedProcessingHours: 24
  },
  {
    name: 'Jeans/Trousers',
    category: 'clothing',
    serviceType: 'wash_and_iron',
    description: 'Jeans/trousers wash & iron service',
    pricing: {
      clientPrice: 7,
      basePrice: 6, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    isPopular: true,
    tags: ['casual', 'denim', 'pants', 'ironed'],
    estimatedProcessingHours: 30
  },
  {
    name: 'Jalabia',
    category: 'clothing',
    serviceType: 'wash_and_fold',
    description: 'Jalabia washing service',
    pricing: {
      clientPrice: 5,
      basePrice: 4, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['traditional', 'cultural', 'religious'],
    estimatedProcessingHours: 24
  },
  {
    name: 'Jalabia',
    category: 'clothing',
    serviceType: 'wash_and_iron',
    description: 'Jalabia wash & iron service',
    pricing: {
      clientPrice: 9,
      basePrice: 8, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['traditional', 'cultural', 'religious', 'ironed'],
    estimatedProcessingHours: 36
  },
  {
    name: 'Hijab',
    category: 'clothing',
    serviceType: 'wash_and_fold',
    description: 'Hijab washing service',
    pricing: {
      clientPrice: 5,
      basePrice: 4, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['traditional', 'cultural', 'religious', 'modest'],
    estimatedProcessingHours: 24
  },
  {
    name: 'Hijab',
    category: 'clothing',
    serviceType: 'wash_and_iron',
    description: 'Hijab wash & iron service',
    pricing: {
      clientPrice: 9,
      basePrice: 8, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['traditional', 'cultural', 'religious', 'modest', 'ironed'],
    estimatedProcessingHours: 36
  },
  {
    name: 'Boxers',
    category: 'clothing',
    serviceType: 'wash_and_fold',
    description: 'Boxers washing service',
    pricing: {
      clientPrice: 2.50,
      basePrice: 1.50, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['underwear', 'mens', 'daily'],
    estimatedProcessingHours: 12
  },
  {
    name: 'Boxers',
    category: 'clothing',
    serviceType: 'wash_and_iron',
    description: 'Boxers wash & iron service',
    pricing: {
      clientPrice: 3,
      basePrice: 2, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['underwear', 'mens', 'daily', 'ironed'],
    estimatedProcessingHours: 18
  },
  {
    name: 'Singlets',
    category: 'clothing',
    serviceType: 'wash_and_fold',
    description: 'Singlets washing service',
    pricing: {
      clientPrice: 2.50,
      basePrice: 1.50, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['underwear', 'mens', 'daily', 'tank-top'],
    estimatedProcessingHours: 12
  },
  {
    name: 'Singlets',
    category: 'clothing',
    serviceType: 'wash_and_iron',
    description: 'Singlets wash & iron service',
    pricing: {
      clientPrice: 3,
      basePrice: 2, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['underwear', 'mens', 'daily', 'tank-top', 'ironed'],
    estimatedProcessingHours: 18
  },
  {
    name: 'Smock',
    category: 'clothing',
    serviceType: 'wash_and_iron',
    description: 'Smock wash & iron service',
    pricing: {
      clientPrice: 11,
      basePrice: 10, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['traditional', 'cultural', 'ghanaian', 'ironed'],
    estimatedProcessingHours: 48
  },

  // Home Items
  {
    name: 'Pillow case',
    category: 'household',
    serviceType: 'wash_and_fold',
    description: 'Pillow case washing service',
    pricing: {
      clientPrice: 2.50,
      basePrice: 1.50, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['home', 'bedding', 'pillow'],
    estimatedProcessingHours: 12
  },
  {
    name: 'Pillow case',
    category: 'household',
    serviceType: 'wash_and_iron',
    description: 'Pillow case wash & iron service',
    pricing: {
      clientPrice: 3.50,
      basePrice: 2.50, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['home', 'bedding', 'pillow', 'ironed'],
    estimatedProcessingHours: 18
  },
  {
    name: 'Blanket (Single)',
    category: 'bedding',
    serviceType: 'wash_and_fold',
    description: 'Single blanket washing service',
    pricing: {
      clientPrice: 16,
      basePrice: 15, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['home', 'bedding', 'blanket', 'single'],
    estimatedProcessingHours: 48
  },
  {
    name: 'Blanket (Double)',
    category: 'bedding',
    serviceType: 'wash_and_fold',
    description: 'Double blanket washing service',
    pricing: {
      clientPrice: 21,
      basePrice: 20, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['home', 'bedding', 'blanket', 'double'],
    estimatedProcessingHours: 72
  },
  {
    name: 'Duvet',
    category: 'bedding',
    serviceType: 'wash_and_fold',
    description: 'Duvet washing service',
    pricing: {
      clientPrice: 31,
      basePrice: 30, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['home', 'bedding', 'duvet', 'comforter'],
    estimatedProcessingHours: 96
  },
  {
    name: 'Bedspread',
    category: 'bedding',
    serviceType: 'wash_and_fold',
    description: 'Bedspread washing service',
    pricing: {
      clientPrice: 9,
      basePrice: 8, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['home', 'bedding', 'bedspread'],
    estimatedProcessingHours: 48
  },
  {
    name: 'Bedspread',
    category: 'bedding',
    serviceType: 'wash_and_iron',
    description: 'Bedspread wash & iron service',
    pricing: {
      clientPrice: 14,
      basePrice: 13, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['home', 'bedding', 'bedspread', 'ironed'],
    estimatedProcessingHours: 72
  },
  {
    name: 'Curtains',
    category: 'household',
    serviceType: 'wash_and_fold',
    description: 'Curtains washing service',
    pricing: {
      clientPrice: 11,
      basePrice: 10, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['home', 'curtains', 'window'],
    estimatedProcessingHours: 72
  },
  {
    name: 'Curtains with Ironing',
    category: 'household',
    serviceType: 'wash_and_iron',
    description: 'Curtains wash & iron service (₵6 extra for ironing)',
    pricing: {
      clientPrice: 17, // 11 + 6 for ironing
      basePrice: 16, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['home', 'curtains', 'window', 'ironed'],
    estimatedProcessingHours: 96
  },

  // Special Items
  {
    name: 'Suit',
    category: 'specialty',
    serviceType: 'wash_and_iron',
    description: 'Suit wash & iron service',
    pricing: {
      clientPrice: 16,
      basePrice: 15, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    isPopular: true,
    tags: ['formal', 'business', 'special', 'ironed'],
    estimatedProcessingHours: 48
  },
  {
    name: 'Bags',
    category: 'accessories',
    serviceType: 'wash_and_fold',
    description: 'Bags washing service',
    pricing: {
      clientPrice: 11,
      basePrice: 10, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['accessories', 'bags', 'special'],
    estimatedProcessingHours: 36
  },
  {
    name: 'Boots (pair)',
    category: 'accessories',
    serviceType: 'special_treatment',
    description: 'Boots cleaning service (pair)',
    pricing: {
      clientPrice: 9,
      basePrice: 8, // Base price (client price includes ₵1 system fee)
      embeddedSystemFee: 1
    },
    availability: {
      isActive: true,
      inStock: true
    },
    tags: ['footwear', 'boots', 'special', 'cleaning'],
    estimatedProcessingHours: 24
  }
];

async function seedCatalog() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mvp_user:Westafrica1@mvp.jfjrw3u.mongodb.net/purwash_mvp?appName=mvp');
    console.log('✅ Connected to database');

    // Use a default ObjectId for addedBy field
    const defaultAdminId = new mongoose.Types.ObjectId();

    // Clear existing catalog items
    await LaundryItem.deleteMany({});
    console.log('🗑️  Cleared existing catalog items');

    // Create slugs and insert items with admin user as addedBy
    const itemsToInsert = catalogItems.map(item => ({
      ...item,
      slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + item.serviceType.replace(/_/g, '-'),
      addedBy: defaultAdminId
    }));

    const insertedItems = await LaundryItem.insertMany(itemsToInsert);
    console.log(`✅ Successfully seeded ${insertedItems.length} catalog items`);

    // Display summary
    console.log('\n📊 Catalog Summary:');
    console.log(`- Clothing items: ${insertedItems.filter(item => item.category === 'clothing').length}`);
    console.log(`- Bedding items: ${insertedItems.filter(item => item.category === 'bedding').length}`);
    console.log(`- Household items: ${insertedItems.filter(item => item.category === 'household').length}`);
    console.log(`- Specialty items: ${insertedItems.filter(item => item.category === 'specialty').length}`);
    console.log(`- Accessories items: ${insertedItems.filter(item => item.category === 'accessories').length}`);
    console.log(`- Popular items: ${insertedItems.filter(item => item.isPopular).length}`);

    console.log('\n🎉 Catalog seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding catalog:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the seed function
if (require.main === module) {
  seedCatalog();
}

module.exports = { seedCatalog, catalogItems };
