const Commission = require('../models/Commission');

/**
 * Process Settlements - T+1 Logic
 * Updates commissions from 'pending_settlement' to 'ready_for_payout' after 24 hours
 */
const processSettlements = async () => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find all commissions that are 'pending_settlement' and older than 24h
    const result = await Commission.updateMany(
      { 
        payoutStatus: 'pending_settlement',
        createdAt: { $lte: oneDayAgo } 
      },
      { 
        $set: { payoutStatus: 'ready_for_payout' } 
      }
    );

    console.log(`✅ Settlement Processed: ${result.modifiedCount} commissions marked ready for payout.`);
    
    return {
      success: true,
      processed: result.modifiedCount,
      message: `${result.modifiedCount} commissions are now ready for payout`
    };

  } catch (error) {
    console.error('❌ Settlement Processing Failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to process settlements'
    };
  }
};

/**
 * Get Settlement Summary
 * Returns counts of commissions by status for dashboard
 */
const getSettlementSummary = async () => {
  try {
    const summary = await Commission.aggregate([
      {
        $group: {
          _id: '$payoutStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const result = {
      pending_settlement: { count: 0, amount: 0 },
      ready_for_payout: { count: 0, amount: 0 },
      processing: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      failed: { count: 0, amount: 0 }
    };

    summary.forEach(item => {
      result[item._id] = {
        count: item.count,
        amount: item.totalAmount
      };
    });

    return result;

  } catch (error) {
    console.error('❌ Settlement Summary Failed:', error);
    throw error;
  }
};

module.exports = { 
  processSettlements,
  getSettlementSummary
};
