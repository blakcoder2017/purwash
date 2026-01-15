const Order = require('../models/Order');
const User = require('../models/User');
const AdminUser = require('../models/AdminUser');
const Commission = require('../models/Commission');
const logAction = require('../utils/auditLogger');
const paystack = require('../utils/paystack');
const mongoose = require('mongoose');

// 1. Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'created' });
    const activeRiders = await User.countDocuments({ role: 'rider', isActive: true });
    const activePartners = await User.countDocuments({ role: 'partner', isActive: true });

    // Revenue calculations
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentOrders = await Order.find({ 
      'paymentDetails.status': 'success',
      createdAt: { $gte: thirtyDaysAgo } 
    });
    
    const monthlyRevenue = recentOrders.reduce((sum, order) => sum + (order.pricing?.totalAmount || 0), 0);
    
    res.json({ 
      success: true,
      data: {
        totalOrders, 
        pendingOrders, 
        activeRiders, 
        activePartners,
        monthlyRevenue,
        recentOrders: [] // Add empty recentOrders array for compatibility
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};

// 2. Order Management - Get all orders with filtering
exports.getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { friendlyId: { $regex: search, $options: 'i' } },
        { 'client.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const orders = await Order.find(filter)
      .populate('rider', 'profile.firstName profile.lastName phone profile.avatar')
      .populate('laundry', 'businessName profile.phone')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// 3. Get single order details
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id)
      .populate('rider', 'profile.firstName profile.lastName phone profile.avatar vehicleType')
      .populate('laundry', 'businessName profile.phone location');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

// 4. Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    order.status = status;
    
    if (notes) {
      order.adminNotes = notes;
    }
    
    await order.save();
    
    // Log the action
    await logAction({
      action: 'ORDER_STATUS_UPDATE',
      performedBy: req.user.id,
      targetOrder: id,
      metadata: { oldStatus, newStatus: status, notes },
      req
    });

    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

// 5. Assign Order to Partners
exports.assignOrder = async (req, res) => {
  try {
    const { orderId, riderId, laundryId } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Validate rider and partner if provided
    if (riderId) {
      const rider = await User.findOne({ _id: riderId, role: 'rider', isActive: true });
      if (!rider) return res.status(404).json({ message: "Rider not found or inactive" });
    }
    
    if (laundryId) {
      const laundry = await User.findOne({ _id: laundryId, role: 'partner', isActive: true });
      if (!laundry) return res.status(404).json({ message: "Partner not found or inactive" });
    }

    order.rider = riderId;
    order.laundry = laundryId;
    order.status = 'assigned';
    await order.save();

    // Log the assignment
    await logAction({
      action: 'ORDER_ASSIGNMENT',
      performedBy: req.user.id,
      targetOrder: orderId,
      metadata: { riderId, laundryId },
      req
    });

    res.json({ success: true, message: "Order assigned successfully" });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning order', error: error.message });
  }
};

// 6. Forced Confirmation (The "2-Hour Rule")
exports.forceConfirmDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: "Order must be in delivered status first" });
    }

    order.isAdminConfirmed = true;
    order.isConfirmedByClient = true;
    await order.save();
    
    // Log the forced confirmation
    await logAction({
      action: 'ORDER_FORCE_CONFIRM',
      performedBy: req.user.id,
      targetOrder: orderId,
      metadata: { originalStatus: order.status },
      req
    });

    res.json({ success: true, message: "Admin forced confirmation" });
  } catch (error) {
    res.status(500).json({ message: 'Error force confirming order', error: error.message });
  }
};

// 7. Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Only allow cancellation of orders not yet delivered
    if (order.status === 'delivered') {
      return res.status(400).json({ message: 'Cannot cancel delivered orders' });
    }
    
    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.cancelledBy = req.user.id;
    order.cancelledAt = new Date();
    
    await order.save();
    
    // Log the cancellation
    await logAction({
      action: 'ORDER_CANCELLATION',
      performedBy: req.user.id,
      targetOrder: id,
      metadata: { reason },
      req
    });
    
    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling order', error: error.message });
  }
};

// 8. Get Investor Metrics
exports.getInvestorMetrics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Total Revenue (Gross Merchandise Value)
    const orders = await Order.find({ 
      status: 'delivered', 
      'paymentDetails.status': 'success',
      createdAt: { $gte: thirtyDaysAgo } 
    });
    
    const mrr = orders.reduce((sum, order) => sum + (order.pricing?.totalAmount || 0), 0);
    const totalOrders = orders.length;
    
    // Get previous period for growth calculation
    const previousPeriodStart = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const previousPeriodEnd = thirtyDaysAgo;
    
    const previousOrders = await Order.find({ 
      status: 'delivered', 
      'paymentDetails.status': 'success',
      createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd } 
    });
    
    const previousMrr = previousOrders.reduce((sum, order) => sum + (order.pricing?.totalAmount || 0), 0);
    const growthRate = previousMrr > 0 ? ((mrr - previousMrr) / previousMrr * 100).toFixed(2) : '0';
    
    res.json({
      mrr,
      arr: mrr * 12,
      arpo: totalOrders > 0 ? (mrr / totalOrders) : 0,
      growthRate: `${growthRate}%`,
      totalOrders,
      previousPeriodOrders: previousOrders.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching investor metrics', error: error.message });
  }
};

// 9. Ban User (Rider/Partner/Client)
exports.banUser = async (req, res) => {
  try {
    const { userId, reason, banType = 'rider' } = req.body;
    const adminId = req.user.id;

    let user;
    if (banType === 'client') {
      user = await Client.findByIdAndUpdate(userId, { 
        accountStatus: 'banned',
        isActive: false,
        banReason: reason
      });
    } else {
      user = await User.findByIdAndUpdate(userId, { 
        accountStatus: 'banned',
        isActive: false,
        banReason: reason
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add the log
    await logAction({
      action: 'USER_BAN',
      performedBy: adminId,
      targetUser: userId,
      metadata: { reason, userName: user.name || user.email, banType },
      req
    });

    res.json({ success: true, message: "User banned and logged." });
  } catch (error) {
    res.status(500).json({ message: 'Error banning user', error: error.message });
  }
};

// 10. Unban User
exports.unbanUser = async (req, res) => {
  try {
    const { userId, banType = 'rider' } = req.body;
    const adminId = req.user.id;

    let user;
    if (banType === 'client') {
      user = await Client.findByIdAndUpdate(userId, { 
        accountStatus: 'active',
        isActive: true,
        banReason: undefined
      });
    } else {
      user = await User.findByIdAndUpdate(userId, { 
        accountStatus: 'active',
        isActive: true,
        banReason: undefined
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add the log
    await logAction({
      action: 'USER_UNBAN',
      performedBy: adminId,
      targetUser: userId,
      metadata: { userName: user.name || user.email, banType },
      req
    });

    res.json({ success: true, message: "User unbanned successfully." });
  } catch (error) {
    res.status(500).json({ message: 'Error unbanning user', error: error.message });
  }
};

// 12. Initiate Payout via Paystack
exports.initiatePayout = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { userId, amount } = req.body; // Amount in GHS
      const adminId = req.user.id;

      // 1. Validate User and Recipient Code
      const user = await User.findById(userId).session(session);
      if (!user || !user.paystack?.recipientCode) {
        throw new Error('User has no valid Transfer Recipient code');
      }

      // 2. Check available balance (commissions ready for payout)
      const availableCommissions = await Commission.find({
        userId: userId,
        payoutStatus: 'ready_for_payout'
      }).session(session);

      const totalAvailable = availableCommissions.reduce((sum, comm) => sum + comm.amount, 0);
      
      if (totalAvailable < amount) {
        throw new Error(`Insufficient available balance. Available: ₵${totalAvailable}, Requested: ₵${amount}`);
      }

      // 3. Create Transfer Reference
      const reference = `PAYOUT-${Date.now()}-${userId.toString().slice(-4)}`;

      // 4. Initiate Transfer with Paystack
      // Note: Paystack Transfer amount is in Pesewas (multiply by 100)
      const transferResponse = await paystack.post('/transfer', {
        source: "balance",
        amount: Math.round(amount * 100), 
        recipient: user.paystack.recipientCode,
        reason: "PurWash Earnings Payout",
        reference: reference
      });

      if (!transferResponse.data.status) {
        throw new Error('Paystack Transfer Request Failed');
      }

      // 5. Update Commissions to 'processing' status
      // We'll mark a subset of commissions that sum up to the payout amount
      let remainingAmount = amount;
      const commissionsToUpdate = [];

      for (const commission of availableCommissions) {
        if (remainingAmount <= 0) break;
        
        const commissionAmount = Math.min(commission.amount, remainingAmount);
        commissionsToUpdate.push({
          commissionId: commission._id,
          amount: commissionAmount
        });
        remainingAmount -= commissionAmount;
      }

      await Commission.updateMany(
        { 
          _id: { $in: commissionsToUpdate.map(c => c.commissionId) },
          userId: userId,
          payoutStatus: 'ready_for_payout'
        },
        { 
          $set: { 
            payoutStatus: 'processing',
            'transferDetails.transferCode': transferResponse.data.data.transfer_code,
            'transferDetails.reference': reference,
            'transferDetails.transferredAt': new Date()
          } 
        },
        { session }
      );

      // 6. Update User Wallet
      user.wallet.pendingBalance = Math.max(0, user.wallet.pendingBalance - amount);
      user.wallet.totalWithdrawn = (user.wallet.totalWithdrawn || 0) + amount;
      await user.save({ session });

      // 7. Log the action
      await logAction({
        action: 'ADMIN_PAYOUT_INITIATED',
        performedBy: adminId,
        targetUser: userId,
        metadata: { 
          amount, 
          reference, 
          recipient: user.paystack.recipientCode,
          transferCode: transferResponse.data.data.transfer_code,
          commissionsCount: commissionsToUpdate.length
        },
        req
      });

      console.log(`✅ Payout Initiated: ₵${amount} to ${user.email} (${user.businessName})`);
    });

    res.json({ 
      success: true, 
      message: 'Transfer initiated successfully. Funds are on the way.' 
    });

  } catch (error) {
    console.error("❌ Payout Error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Payout failed' 
    });
  } finally {
    await session.endSession();
  }
};

// 13. Get Payouts Summary
exports.getPayoutsSummary = async (req, res) => {
  try {
    const { processSettlements, getSettlementSummary } = require('../utils/settlement');
    
    // Process settlements first (T+1 logic)
    await processSettlements();
    
    // Get summary
    const summary = await getSettlementSummary();
    
    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('❌ Payouts Summary Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payouts summary'
    });
  }
};