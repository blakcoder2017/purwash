const User = require('../models/User');
const Earnings = require('../models/Earnings');
const Order = require('../models/Order');
const Commission = require('../models/Commission');
const mongoose = require('mongoose');

/**
 * Get wallet data for rider/partner
 * GET /api/wallet
 */
const getWalletData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user with wallet data
    const user = await User.findById(userId).select('wallet role profile firstName lastName email businessName paystack momo');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only allow riders and partners to access wallet
    if (!['rider', 'partner'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Wallet access restricted to riders and partners'
      });
    }

    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    let commissions = await Commission.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    if (commissions.length === 0) {
      const orderIds = await Order.find({ $or: [{ rider: userObjectId }, { laundry: userObjectId }] })
        .select('_id')
        .lean();
      const ids = orderIds.map(order => order._id);
      if (ids.length > 0) {
        commissions = await Commission.find({
          orderId: { $in: ids },
          userRole: user.role
        })
          .sort({ createdAt: -1 })
          .limit(100)
          .lean();
      }
    }

    const totalEarned = commissions.reduce((sum, commission) => sum + (commission.amount || 0), 0);
    const pendingBalance = commissions
      .filter(commission => commission.payoutStatus !== 'paid')
      .reduce((sum, commission) => sum + (commission.amount || 0), 0);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H5',
        location: 'backend/controllers/walletController.js:60',
        message: 'wallet_totals_computed',
        data: {
          role: user.role,
          commissionCount: commissions.length,
          totalEarned,
          pendingBalance
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion

    const commissionTransactions = commissions.map((commission, index) => ({
      _id: commission._id || `${index}`,
      type: 'earning',
      amount: commission.amount,
      description: `${commission.userRole === 'rider' ? 'Delivery' : 'Service'} Fee`,
      orderId: commission.orderId,
      createdAt: commission.confirmedAt || commission.createdAt
    }));

    let earnings = await Earnings.findOne({ userId })
      .populate('transactions.orderId', 'friendlyId totalAmount createdAt')
      .populate('transactions.performedBy', 'firstName lastName');

    if (!earnings) {
      earnings = await Earnings.create({
        userId,
        wallet: { totalEarned, pendingBalance },
        transactions: commissionTransactions
      });
    } else {
      earnings.wallet.totalEarned = totalEarned;
      earnings.wallet.pendingBalance = pendingBalance;
      if (!earnings.transactions || earnings.transactions.length === 0) {
        earnings.transactions = commissionTransactions;
      }
      await earnings.save();
    }

    await User.findByIdAndUpdate(userId, {
      $set: {
        'wallet.totalEarned': totalEarned,
        'wallet.pendingBalance': pendingBalance
      }
    });

    // Get recent orders that contribute to earnings
    const recentOrders = await Order.find({
      $or: [
        { rider: userId },
        { laundry: userId }
      ],
      paymentDetails: { status: 'success' },
      $or: [
        { isConfirmedByClient: true },
        { isAdminConfirmed: true }
      ]
    })
    .select('friendlyId totalAmount pricing paymentDetails createdAt status rider laundry isConfirmedByClient isAdminConfirmed isDisbursed')
    .populate('rider', 'firstName lastName')
    .populate('laundry', 'businessName')
    .sort({ createdAt: -1 })
    .limit(10);

    // Calculate statistics
    const stats = {
      totalEarned,
      pendingBalance,
      totalOrders: recentOrders.length,
      completedOrders: recentOrders.filter(order => order.status === 'delivered').length,
      pendingOrders: recentOrders.filter(order => !order.isDisbursed).length
    };

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          role: user.role,
          name: user.profile?.firstName && user.profile?.lastName 
            ? `${user.profile.firstName} ${user.profile.lastName}`
            : user.businessName || user.email,
          email: user.email,
          businessName: user.businessName,
          momo: user.momo,
          paystack: user.paystack
        },
        wallet: {
          totalEarned,
          pendingBalance
        },
        stats,
        transactions: earnings?.transactions || commissionTransactions,
        recentOrders
      }
    });

  } catch (error) {
    console.error('❌ Error fetching wallet data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet data',
      error: error.message
    });
  }
};

/**
 * Get transaction history
 * GET /api/wallet/transactions
 */
const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;

    // Build filter
    const filter = { userId };
    if (type) filter['transactions.type'] = type;
    
    if (startDate || endDate) {
      filter['transactions.createdAt'] = {};
      if (startDate) filter['transactions.createdAt'].$gte = new Date(startDate);
      if (endDate) filter['transactions.createdAt'].$lte = new Date(endDate);
    }

    let earnings = await Earnings.findOne(filter)
      .populate('transactions.orderId', 'friendlyId totalAmount createdAt')
      .populate('transactions.performedBy', 'firstName lastName');

    if (!earnings || !earnings.transactions || earnings.transactions.length === 0) {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : userId;

    let commissions = await Commission.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();

    if (commissions.length === 0) {
        const orderIds = await Order.find({ $or: [{ rider: userObjectId }, { laundry: userObjectId }] })
            .select('_id')
            .lean();
        const ids = orderIds.map(order => order._id);
        if (ids.length > 0) {
            commissions = await Commission.find({
                orderId: { $in: ids },
                userRole: { $in: ['rider', 'partner'] }
            })
                .sort({ createdAt: -1 })
                .limit(200)
                .lean();
        }
    }

      const fallbackTransactions = commissions.map((commission, index) => ({
        _id: commission._id || `${index}`,
        type: 'earning',
        amount: commission.amount,
        description: `${commission.userRole === 'rider' ? 'Delivery' : 'Service'} Fee`,
        orderId: commission.orderId,
        createdAt: commission.confirmedAt || commission.createdAt
      }));

      earnings = { transactions: fallbackTransactions };
    }

    // Sort transactions by date (newest first)
    const sortedTransactions = earnings.transactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(sortedTransactions.length / limit),
          total: sortedTransactions.length,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching transaction history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history',
      error: error.message
    });
  }
};

/**
 * Get earnings summary
 * GET /api/wallet/summary
 */
const getEarningsSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query; // week, month, year

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get orders in date range
    const orders = await Order.find({
      $or: [
        { rider: userId },
        { laundry: userId }
      ],
      paymentDetails: { 
        status: 'success',
        paidAt: { $gte: startDate }
      },
      $or: [
        { isConfirmedByClient: true },
        { isAdminConfirmed: true }
      ]
    }).select('totalAmount pricing paymentDetails.paidAt createdAt');

    // Calculate earnings
    let totalEarnings = 0;
    const dailyEarnings = {};

    orders.forEach(order => {
      const day = order.paymentDetails.paidAt.toISOString().split('T')[0];
      const commission = calculateCommission(order, userId);
      
      totalEarnings += commission;
      
      if (!dailyEarnings[day]) {
        dailyEarnings[day] = 0;
      }
      dailyEarnings[day] += commission;
    });

    // Get user's current wallet balance
    const user = await User.findById(userId).select('wallet');
    
    res.json({
      success: true,
      data: {
        period,
        startDate,
        endDate: now,
        totalEarnings,
        totalOrders: orders.length,
        averagePerOrder: orders.length > 0 ? totalEarnings / orders.length : 0,
        currentBalance: user.wallet.totalEarned || 0,
        pendingBalance: user.wallet.pendingBalance || 0,
        dailyEarnings: Object.entries(dailyEarnings).map(([date, amount]) => ({
          date,
          amount
        })).sort((a, b) => new Date(a.date) - new Date(b.date))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching earnings summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch earnings summary',
      error: error.message
    });
  }
};

/**
 * Calculate commission for an order
 * @param {Object} order - Order document
 * @param {String} userId - User ID (rider or partner)
 * @returns {Number} Commission amount
 */
const calculateCommission = (order, userId) => {
  // This is a placeholder - implement your commission logic here
  // Example: Rider gets 20% of delivery fee, Partner gets 80% of service fee
  
  const deliveryFee = order.pricing.deliveryFee || 0;
  const serviceFee = order.pricing.serviceFee || 0;
  
  // If user is the rider
  if (order.rider && order.rider.toString() === userId.toString()) {
    // Rider gets 70% of delivery fee
    return Math.round(deliveryFee * 0.7);
  }
  
  // If user is the laundry partner
  if (order.laundry && order.laundry.toString() === userId.toString()) {
    // Partner gets service fee + 30% of delivery fee
    return serviceFee + Math.round(deliveryFee * 0.3);
  }
  
  return 0;
};

module.exports = {
  getWalletData,
  getTransactionHistory,
  getEarningsSummary
};
