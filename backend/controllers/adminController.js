const Order = require('../models/Order');
const User = require('../models/User');
const AdminUser = require('../models/AdminUser');
const logAction = require('../utils/auditLogger');

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