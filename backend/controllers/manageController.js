const Order = require('../models/Order');
const User = require('../models/User');

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

    res.json({ success: true, message: "Stakeholders assigned successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending orders that need assignment
exports.getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'created' })
      .sort({ createdAt: -1 })
      .select('friendlyId client.location pricing createdAt');
    
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

    res.json({ success: true, newStatus: order.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};