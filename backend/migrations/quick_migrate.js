const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Quick Migration Script
 * Ensures basic database structure for commission system
 */

const quickMigrate = async () => {
  try {
    console.log('🔄 Starting quick migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE, {
      dbName: 'purwash_mvp'
    });
    console.log('✅ Connected to MongoDB');

    // 1. Ensure User model has wallet fields
    const User = require('../models/User');
    
    // Update users without wallet fields
    const userUpdate = await User.updateMany(
      { 'wallet.totalEarned': { $exists: false } },
      { 
        $set: { 
          'wallet.totalEarned': 0,
          'wallet.pendingBalance': 0
        }
      }
    );
    console.log(`✅ Updated ${userUpdate.modifiedCount} users with wallet fields`);

    // 2. Ensure Order model has commission tracking fields
    const Order = require('../models/Order');
    
    const orderUpdate = await Order.updateMany(
      { 
        $or: [
          { isConfirmedByClient: { $exists: false } },
          { isAdminConfirmed: { $exists: false } },
          { isDisbursed: { $exists: false } }
        ]
      },
      { 
        $set: { 
          isConfirmedByClient: false,
          isAdminConfirmed: false,
          isDisbursed: false
        }
      }
    );
    console.log(`✅ Updated ${orderUpdate.modifiedCount} orders with commission tracking`);

    // 3. Create Commission collection (will create automatically when first used)
    const Commission = require('../models/Commission');
    console.log('✅ Commission model ready');

    // 4. Create Earnings documents for riders/partners
    const Earnings = require('../models/Earnings');
    const riderPartnerUsers = await User.find({
      role: { $in: ['rider', 'partner'] }
    });

    for (const user of riderPartnerUsers) {
      await Earnings.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          wallet: {
            totalEarned: user.wallet?.totalEarned || 0,
            pendingBalance: user.wallet?.pendingBalance || 0
          },
          transactions: []
        },
        { upsert: true }
      );
    }
    console.log(`✅ Ensured earnings documents for ${riderPartnerUsers.length} riders/partners`);

    console.log('\n📊 Quick Migration Summary:');
    console.log(`- Users with wallet fields: ${userUpdate.modifiedCount}`);
    console.log(`- Orders with commission tracking: ${orderUpdate.modifiedCount}`);
    console.log(`- Riders/Partners with earnings: ${riderPartnerUsers.length}`);

    console.log('\n✅ Quick migration completed successfully!');

  } catch (error) {
    console.error('❌ Quick migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run if called directly
if (require.main === module) {
  quickMigrate()
    .then(() => {
      console.log('🎉 Quick migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Quick migration failed:', error);
      process.exit(1);
    });
}

module.exports = quickMigrate;
