/**
 * Laundry Items Seeder
 * 
 * Populates the database with sample laundry items
 * Run with: node seeders/laundryItems.js
 */

const mongoose = require('mongoose');
const LaundryItem = require('../models/LaundryItem');
const sampleItems = require('../sampleData/laundryItems');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/purwash', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const seedLaundryItems = async () => {
  try {
    // Clear existing items
    await LaundryItem.deleteMany({});
    console.log('Cleared existing laundry items');

    // Add sample items
    const items = await LaundryItem.insertMany(sampleItems);
    console.log(`Added ${items.length} sample laundry items`);

    // Display added items
    items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} - ₵${item.pricing.clientPrice} (${item.category})`);
    });

    console.log('✅ Laundry items seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding laundry items:', error);
    process.exit(1);
  }
};

// Run the seeder
seedLaundryItems();
