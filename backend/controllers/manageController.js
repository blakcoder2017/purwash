const Order = require('../models/Order');
const User = require('../models/User');
const { emitOrderAssignment, emitOrderStatusUpdate } = require('../utils/websocket');

// Assign rider and laundry to an order
exports.assignStakeholders = async (req, res) => {
  const { id } = req.params;
  const { riderId, laundryId } = req.body;

  try {
    const order = await Order.findById(id);
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

    // Emit WebSocket event to assigned rider and partner
    emitOrderAssignment(riderId, laundryId, order);

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
      // Rider sees: client info, partner info, full pricing, delivery fee
      orders = await Order.find({ 
        status: 'assigned',
        rider: userId 
      })
      .populate('laundry', 'businessName profile.firstName profile.lastName phone')
      .select('friendlyId client location pricing rider laundry status createdAt')
      .sort({ createdAt: -1 });
    } else if (userRole === 'partner') {
      // Partner sees: rider info, partial pricing (only laundry fee), no client details
      orders = await Order.find({ 
        status: 'assigned',
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

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const statusPriority = {
    'created': 1, 'assigned': 2, 'on_my_way_to_pick': 3, 'picked_up': 4,
    'dropped_at_laundry': 5, 'washing': 6, 'ready_for_pick': 7, 
    'out_for_delivery': 8, 'delivered': 9
  };

  try {
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Senior Guard: Don't allow skipping steps or going backwards
    if (statusPriority[status] <= statusPriority[order.status]) {
      return res.status(400).json({ message: "Invalid status transition" });
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