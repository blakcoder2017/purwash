const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Database Migration Script
 * Adds Commission model and updates existing data for wallet/commission system
 */

const migrateDatabase = async () => {
  try {
    console.log('🔄 Starting database migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE, {
      dbName: 'purwash_mvp'
    });
    console.log('✅ Connected to MongoDB');

    // 1. Create Commission collection with indexes
    const Commission = require('../models/Commission');
    await Commission.createIndexes();
    console.log('✅ Commission collection and indexes created');

    // 2. Update existing Users to ensure wallet fields exist
    const User = require('../models/User');
    const users = await User.updateMany(
      { 
        $or: [
          { 'wallet.totalEarned': { $exists: false } },
          { 'wallet.pendingBalance': { $exists: false } }
        ]
      },
      { 
        $set: { 
          'wallet.totalEarned': 0,
          'wallet.pendingBalance': 0
        }
      }
    );
    console.log(`✅ Updated ${users.modifiedCount} users with wallet fields`);

    // 3. Create Earnings documents for existing riders and partners
    const Earnings = require('../models/Earnings');
    const riderPartnerUsers = await User.find({
      role: { $in: ['rider', 'partner'] }
    });

    for (const user of riderPartnerUsers) {
      const existingEarnings = await Earnings.findOne({ userId: user._id });
      if (!existingEarnings) {
        await Earnings.create({
          userId: user._id,
          wallet: {
            totalEarned: user.wallet?.totalEarned || 0,
            pendingBalance: user.wallet?.pendingBalance || 0
          },
          transactions: []
        });
      }
    }
    console.log(`✅ Created earnings documents for ${riderPartnerUsers.length} riders/partners`);

    // 4. Update existing Orders to include commission tracking fields
    const Order = require('../models/Order');
    const orders = await Order.updateMany(
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
    console.log(`✅ Updated ${orders.modifiedCount} orders with commission tracking fields`);

    // 5. Create commissions for existing paid orders with assigned riders/partners
    const paidOrders = await Order.find({
      'paymentDetails.status': 'success',
      $or: [
        { rider: { $exists: true, $ne: null } },
        { laundry: { $exists: true, $ne: null } }
      ]
    });

    let commissionsCreated = 0;
    for (const order of paidOrders) {
      // Auto-confirm existing paid orders for migration
      order.isConfirmedByClient = true;
      order.confirmedAt = new Date();
      await order.save();

      // Create commissions
      try {
        const createdCommissions = await Commission.createOrderCommissions(order, 'system');
        commissionsCreated += createdCommissions.length;
      } catch (error) {
        console.log(`⚠️ Could not create commissions for order ${order.friendlyId}:`, error.message);
      }
    }
    console.log(`✅ Created ${commissionsCreated} commissions for existing orders`);

    // 6. Verify migration results
    const commissionCount = await Commission.countDocuments();
    const earningsCount = await Earnings.countDocuments();
    const userWalletCount = await User.countDocuments({
      'wallet.totalEarned': { $exists: true },
      'wallet.pendingBalance': { $exists: true }
    });

    console.log('\n📊 Migration Summary:');
    console.log(`- Commission documents: ${commissionCount}`);
    console.log(`- Earnings documents: ${earningsCount}`);
    console.log(`- Users with wallet fields: ${userWalletCount}`);
    console.log(`- Orders updated: ${orders.modifiedCount}`);
    console.log(`- Commissions created: ${commissionsCreated}`);

    console.log('\n✅ Database migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run migration if called directly
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateDatabase;
