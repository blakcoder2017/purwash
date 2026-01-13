const Order = require('../models/Order');
const User = require('../models/User');
const logAction = require('../utils/auditLogger');

// 1. Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ status: 'created' });
  const activeRiders = await User.countDocuments({ role: 'rider', 'paymentInfo.isVerified': true });
  
  res.json({ totalOrders, pendingOrders, activeRiders });
};

// 2. Assign Order to Partners
exports.assignOrder = async (req, res) => {
  const { orderId, riderId, laundryId } = req.body;
  
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.rider = riderId;
  order.laundry = laundryId;
  order.status = 'assigned';
  await order.save();

  // Pro-Tip: Here you would trigger SMS notifications to the Rider and Laundry
  res.json({ success: true, message: "Order assigned successfully" });
};

// 3. Forced Confirmation (The "2-Hour Rule")
exports.forceConfirmDelivery = async (req, res) => {
  const { orderId } = req.params;
  
  const order = await Order.findById(orderId);
  if (order.status !== 'delivered') {
    return res.status(400).json({ message: "Order must be in delivered status first" });
  }

  order.isAdminConfirmed = true;
  order.isConfirmedByClient = true;
  await order.save();

  res.json({ success: true, message: "Admin forced confirmation" });
};

exports.getInvestorMetrics = async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  // Total Revenue (Gross Merchandise Value)
  const orders = await Order.find({ 
    status: 'delivered', 
    createdAt: { $gte: thirtyDaysAgo } 
  });
  
  const mrr = orders.reduce((sum, order) => sum + order.pricing.totalAmount, 0);
  const totalOrders = orders.length;
  
  res.json({
    mrr,
    arr: mrr * 12,
    arpo: totalOrders > 0 ? (mrr / totalOrders) : 0,
    growthRate: "15%" // You'd compare this to the previous 30-day block
  });
};

exports.banUser = async (req, res) => {
  const { userId, reason } = req.body;
  const adminId = req.user.id; // Assuming you have auth middleware

  const user = await User.findByIdAndUpdate(userId, { accountStatus: 'banned' });

  // Add the log
  await logAction({
    action: 'USER_BAN',
    performedBy: adminId,
    targetUser: userId,
    metadata: { reason, userName: user.name },
    req
  });

  res.json({ success: true, message: "User banned and logged." });
};