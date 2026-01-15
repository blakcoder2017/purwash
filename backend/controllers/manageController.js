const Order = require('../models/Order');
const User = require('../models/User');
const Commission = require('../models/Commission');
const { emitOrderAssignment, emitOrderStatusUpdate } = require('../utils/websocket');
const { sendPushToUser } = require('../utils/pushNotifications');

// Assign rider and laundry to an order
exports.assignStakeholders = async (req, res) => {
  const { id, orderId } = req.params;
  const targetId = orderId || id;
  const { riderId, laundryId } = req.body;

  try {
    const order = await Order.findById(targetId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Verify rider and laundry exist
    const rider = await User.findById(riderId);
    const laundry = await User.findById(laundryId);
    
    if (!rider || !laundry) {
      return res.status(400).json({ message: "Invalid rider or laundry ID" });
    }

    order.rider = riderId;
    order.laundry = laundryId;
    order.status = 'assigned';
    await order.save();

    if (order.paymentDetails?.status === 'success') {
      await Commission.createMissingOrderCommissions(order, 'admin');
    }

    // Emit WebSocket event to assigned rider and partner
    emitOrderAssignment(riderId, laundryId, order);

    // Send push notifications
    await Promise.all([
      sendPushToUser(riderId, {
        title: 'New Delivery Assigned',
        body: `Order #${order.friendlyId} is ready for pickup.`,
        data: { orderId: order._id.toString() }
      }),
      sendPushToUser(laundryId, {
        title: 'New Laundry Job Assigned',
        body: `Order #${order.friendlyId} will arrive soon.`,
        data: { orderId: order._id.toString() }
      })
    ]);

    res.json({ success: true, message: "Stakeholders assigned successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending orders that need assignment
exports.getPendingOrders = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    
    let orders;
    
    if (userRole === 'rider') {
      // Rider sees: assigned through delivery workflow
      orders = await Order.find({ 
        status: { $in: ['assigned', 'on_my_way_to_pick', 'picked_up', 'dropped_at_laundry', 'washing', 'ready_for_pick', 'out_for_delivery'] },
        rider: userId 
      })
      .populate('laundry', 'businessName profile.firstName profile.lastName phone')
      .select('friendlyId client location pricing rider laundry status createdAt')
      .sort({ createdAt: -1 });
    } else if (userRole === 'partner') {
      // Partner sees: assigned and in-shop workflow statuses
      orders = await Order.find({ 
        status: { $in: ['assigned', 'dropped_at_laundry', 'washing', 'ready_for_pick'] },
        laundry: userId 
      })
      .populate('rider', 'profile.firstName profile.lastName phone')
      .select('friendlyId location pricing rider laundry status createdAt items')
      .sort({ createdAt: -1 });
    } else {
      // Default: unassigned orders for admin
      orders = await Order.find({ status: 'created' })
        .select('friendlyId client.location pricing createdAt')
        .sort({ createdAt: -1 });
    }
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get past job history for riders and partners
exports.getOrderHistory = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

    const completedStatuses = ['delivered', 'cancelled'];
    let orders;

    if (userRole === 'rider') {
      orders = await Order.find({
        status: { $in: completedStatuses },
        rider: userId
      })
        .populate('laundry', 'businessName profile.firstName profile.lastName phone')
        .select('friendlyId client location pricing rider laundry status createdAt')
        .sort({ createdAt: -1 })
        .limit(limit);
    } else if (userRole === 'partner') {
      orders = await Order.find({
        status: { $in: completedStatuses },
        laundry: userId
      })
        .populate('rider', 'profile.firstName profile.lastName phone')
        .select('friendlyId location pricing rider laundry status createdAt items')
        .sort({ createdAt: -1 })
        .limit(limit);
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id, orderId } = req.params;
  const targetId = orderId || id;
  const { status } = req.body;

  const statusPriority = {
    'created': 1, 'assigned': 2, 'on_my_way_to_pick': 3, 'picked_up': 4,
    'dropped_at_laundry': 5, 'washing': 6, 'ready_for_pick': 7, 
    'out_for_delivery': 8, 'delivered': 9
  };

  try {
    const order = await Order.findById(targetId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!statusPriority[status]) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Senior Guard: Don't allow going backwards
    if (statusPriority[status] < statusPriority[order.status]) {
      return res.status(400).json({ message: "Invalid status transition" });
    }

    // No-op update (avoid failing on repeated clicks)
    if (statusPriority[status] === statusPriority[order.status]) {
      return res.json({ success: true, newStatus: order.status });
    }

    order.status = status;
    await order.save();

    // Emit WebSocket event for status update
    emitOrderStatusUpdate(order._id, status, req.user.id);

    res.json({ success: true, newStatus: order.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};