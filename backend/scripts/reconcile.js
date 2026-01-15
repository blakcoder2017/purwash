require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Order = require('../models/Order');
const connectDB = require('../config/db');

/**
 * Reconciliation Script
 * Finds successful Paystack transactions that don't have corresponding orders in our database
 * This catches "ghost orders" where user paid but frontend never sent createOrder request
 */
const reconcilePayments = async () => {
  await connectDB();
  console.log('🔍 Starting Payment Reconciliation...');

  try {
    // 1. Get successful transactions from Paystack (last 1 hour)
    const fromDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const response = await axios.get(
      `https://api.paystack.co/transaction?status=success&from=${fromDate}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    const transactions = response.data.data;
    console.log(`Found ${transactions.length} Paystack transactions in last hour.`);

    let missingOrders = [];
    
    for (const tx of transactions) {
      // 2. Check if this reference exists in our Orders
      const exists = await Order.findOne({ 'paymentDetails.reference': tx.reference });

      if (!exists) {
        console.log(`⚠️ MISSING ORDER FOUND! Ref: ${tx.reference}, Amount: ₵${tx.amount / 100}`);
        
        // Extract user info from metadata
        const metadata = tx.metadata || {};
        const clientName = metadata.custom_fields?.find(f => f.variable_name === 'client_name')?.value;
        const phone = metadata.custom_fields?.find(f => f.variable_name === 'phone')?.value;
        const email = metadata.customer?.email;

        missingOrders.push({
          reference: tx.reference,
          amount: tx.amount / 100,
          paidAt: tx.paid_at,
          customer: tx.customer,
          metadata: {
            clientName,
            phone,
            email,
            custom_fields: metadata.custom_fields
          }
        });
        
        console.log(`   Customer Info: ${clientName || 'N/A'} (${phone || 'N/A'})`);
      }
    }
    
    if (missingOrders.length > 0) {
      console.log(`\n📋 RECONCILIATION SUMMARY:`);
      console.log(`- Total Missing Orders: ${missingOrders.length}`);
      console.log(`- Total Amount: ₵${missingOrders.reduce((sum, order) => sum + order.amount, 0)}`);
      console.log(`\n⚠️ ACTION REQUIRED:`);
      console.log(`1. Contact customers who paid but have no orders`);
      console.log(`2. Manually create orders if needed`);
      console.log(`3. Investigate frontend issues that may cause dropped requests`);
      
      // Optionally save to a "LostOrders" collection for manual review
      // await saveLostOrders(missingOrders);
    } else {
      console.log(`✅ All transactions accounted for. No missing orders found.`);
    }
    
    console.log('\n✅ Reconciliation Complete.');
    
    return {
      success: true,
      totalTransactions: transactions.length,
      missingOrders: missingOrders.length,
      missingAmount: missingOrders.reduce((sum, order) => sum + order.amount, 0)
    };
    
  } catch (error) {
    console.error('❌ Reconciliation Failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  } finally {
    mongoose.connection.close();
  }
};

/**
 * Save missing orders to a collection for manual review
 */
const saveLostOrders = async (missingOrders) => {
  try {
    const LostOrder = mongoose.model('LostOrder', new mongoose.Schema({
      reference: String,
      amount: Number,
      paidAt: Date,
      customer: Object,
      metadata: Object,
      status: { type: String, enum: ['pending', 'resolved', 'cancelled'], default: 'pending' },
      createdAt: { type: Date, default: Date.now }
    }));
    
    await LostOrder.insertMany(missingOrders);
    console.log(`💾 Saved ${missingOrders.length} missing orders to LostOrders collection`);
  } catch (error) {
    console.error('❌ Failed to save lost orders:', error.message);
  }
};

// Run if called directly
if (require.main === module) {
  reconcilePayments()
    .then(result => {
      console.log('\n📊 Final Result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { reconcilePayments, saveLostOrders };
