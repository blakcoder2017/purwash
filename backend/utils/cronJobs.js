const cron = require('node-cron');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLogs');
const { processSettlements } = require('./settlement');

// Runs every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  const gracePeriod = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

  const stagnantOrders = await Order.find({
    status: 'delivered',
    isConfirmedByClient: false,
    updatedAt: { $lte: gracePeriod }
  });

  for (let order of stagnantOrders) {
    order.isConfirmedByClient = true;
    order.isAdminConfirmed = true; // Flagged as system-confirmed
    await order.save();

    await AuditLog.create({
      action: 'ADMIN_FORCE_CONFIRM',
      orderId: order._id,
      metadata: { reason: '2-hour timeout reached' }
    });
    
    console.log(`[System] Auto-confirmed Order #${order.friendlyId}`);
  }
});

// Runs every hour to move commissions to ready_for_payout (T+1)
cron.schedule('0 * * * *', async () => {
  await processSettlements();
});