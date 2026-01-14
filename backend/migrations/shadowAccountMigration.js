const mongoose = require('mongoose');
const Client = require('../models/Client');
const Order = require('../models/Order');

/**
 * Migration Script: Update existing data for Shadow Account Strategy
 * 
 * This script will:
 * 1. Update existing Client schema to support shadow accounts
 * 2. Update existing Order schema to link with client accounts
 * 3. Set default values for new fields
 */

async function migrateToShadowAccounts() {
  try {
    console.log('🔄 Starting migration to Shadow Account strategy...');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/purwash_mvp');
    console.log('✅ Connected to MongoDB');
    
    // Step 1: Update existing clients to support shadow account fields
    console.log('📝 Updating existing clients...');
    const clientUpdateResult = await Client.updateMany(
      { 
        isShadowAccount: { $exists: false },
        hasFullAccount: { $exists: false }
      },
      { 
        $set: { 
          isShadowAccount: false, // Existing clients had full accounts
          hasFullAccount: true,
          lastOrderDate: null
        }
      }
    );
    console.log(`✅ Updated ${clientUpdateResult.modifiedCount} existing clients`);
    
    // Step 2: Update existing orders to link with client accounts
    console.log('📦 Updating existing orders...');
    const orders = await Order.find({ 
      'client.clientId': { $exists: false },
      'client.phone': { $exists: true }
    });
    
    let ordersUpdated = 0;
    for (const order of orders) {
      // Find client by phone number
      const client = await Client.findOne({ phone: order.client.phone });
      
      if (client) {
        // Update order to link with client
        await Order.findByIdAndUpdate(order._id, {
          $set: {
            'client.clientId': client._id,
            'client.clientName': client.name, // Ensure clientName is set
            convertedToClientOrder: true,
            isGuestOrder: false
          }
        });
        ordersUpdated++;
      } else {
        // If no client found, ensure clientName is set from available data
        await Order.findByIdAndUpdate(order._id, {
          $set: {
            'client.clientName': order.client.phone, // Fallback to phone if no name
            convertedToClientOrder: false,
            isGuestOrder: true
          }
        });
      }
    }
    
    console.log(`✅ Updated ${ordersUpdated} orders to link with client accounts`);
    
    // Step 3: Create indexes for efficient phone-based queries (if they don't exist)
    console.log('🔍 Checking indexes...');
    try {
      await Client.collection.createIndex({ phone: 1 });
      console.log('✅ Client phone index created or already exists');
    } catch (error) {
      if (error.code === 86) {
        console.log('✅ Client phone index already exists');
      } else {
        throw error;
      }
    }
    
    try {
      await Order.collection.createIndex({ 'client.phone': 1, createdAt: -1 });
      console.log('✅ Order phone index created or already exists');
    } catch (error) {
      if (error.code === 86) {
        console.log('✅ Order phone index already exists');
      } else {
        throw error;
      }
    }
    console.log('✅ Index verification complete');
    
    // Step 4: Verify migration
    console.log('🔍 Verifying migration...');
    
    const clientCount = await Client.countDocuments();
    const shadowClientCount = await Client.countDocuments({ isShadowAccount: true });
    const fullAccountCount = await Client.countDocuments({ hasFullAccount: true });
    
    const orderCount = await Order.countDocuments();
    const linkedOrderCount = await Order.countDocuments({ 'client.clientId': { $exists: true } });
    
    console.log('\n📊 Migration Summary:');
    console.log(`Total Clients: ${clientCount}`);
    console.log(`Shadow Accounts: ${shadowClientCount}`);
    console.log(`Full Accounts: ${fullAccountCount}`);
    console.log(`Total Orders: ${orderCount}`);
    console.log(`Orders Linked to Clients: ${linkedOrderCount}`);
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateToShadowAccounts();
}

module.exports = migrateToShadowAccounts;
