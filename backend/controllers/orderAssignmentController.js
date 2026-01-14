const Order = require('../models/Order');
const User = require('../models/User');
const Commission = require('../models/Commission');
const mongoose = require('mongoose');

/**
 * Assign rider to order
 * PUT /api/orders/:orderId/assign-rider
 */
const assignRider = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { riderId } = req.body;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(riderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID or rider ID'
      });
    }

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get rider
    const rider = await User.findById(riderId);
    if (!rider || rider.role !== 'rider') {
      return res.status(404).json({
        success: false,
        message: 'Rider not found'
      });
    }

    // Assign rider
    order.rider = riderId;
    order.status = 'assigned';
    await order.save();

    // Create commissions if order is confirmed and paid
    if (order.paymentDetails.status === 'success' && (order.isConfirmedByClient || order.isAdminConfirmed)) {
      await Commission.createOrderCommissions(order, 'admin');
    }

    res.json({
      success: true,
      message: 'Rider assigned successfully',
      data: {
        order: {
          _id: order._id,
          friendlyId: order.friendlyId,
          status: order.status,
          rider: {
            _id: rider._id,
            name: rider.profile?.firstName && rider.profile?.lastName 
              ? `${rider.profile.firstName} ${rider.profile.lastName}`
              : rider.businessName || rider.email,
            phone: rider.profile?.phone,
            vehicleType: rider.vehicleType
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Error assigning rider:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign rider',
      error: error.message
    });
  }
};

/**
 * Assign laundry partner to order
 * PUT /api/orders/:orderId/assign-partner
 */
const assignPartner = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { partnerId } = req.body;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(partnerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID or partner ID'
      });
    }

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get partner
    const partner = await User.findById(partnerId);
    if (!partner || partner.role !== 'partner') {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    // Assign partner
    order.laundry = partnerId;
    await order.save();

    // Create commissions if order is confirmed and paid
    if (order.paymentDetails.status === 'success' && (order.isConfirmedByClient || order.isAdminConfirmed)) {
      await Commission.createOrderCommissions(order, 'admin');
    }

    res.json({
      success: true,
      message: 'Partner assigned successfully',
      data: {
        order: {
          _id: order._id,
          friendlyId: order.friendlyId,
          status: order.status,
          partner: {
            _id: partner._id,
            name: partner.businessName || partner.email,
            phone: partner.profile?.phone,
            location: partner.location
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Error assigning partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign partner',
      error: error.message
    });
  }
};

/**
 * Confirm order (admin force confirmation)
 * PUT /api/orders/:orderId/confirm
 */
const confirmOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { notes } = req.body;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Confirm order
    order.isAdminConfirmed = true;
    order.confirmedAt = new Date();
    order.adminNotes = notes || order.adminNotes;
    await order.save();

    // Create commissions if payment is successful and rider/partner are assigned
    if (order.paymentDetails.status === 'success' && (order.rider || order.laundry)) {
      await Commission.createOrderCommissions(order, 'admin');
    }

    res.json({
      success: true,
      message: 'Order confirmed successfully',
      data: {
        order: {
          _id: order._id,
          friendlyId: order.friendlyId,
          status: order.status,
          isAdminConfirmed: true,
          confirmedAt: order.confirmedAt,
          adminNotes: order.adminNotes
        }
      }
    });

  } catch (error) {
    console.error('❌ Error confirming order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm order',
      error: error.message
    });
  }
};

/**
 * Get available riders for assignment
 * GET /api/orders/available-riders
 */
const getAvailableRiders = async (req, res) => {
  try {
    const riders = await User.find({
      role: 'rider',
      isActive: true,
      isOnline: true
    }).select('profile firstName lastName phone businessName vehicleType vehicleNumber isOnline');

    res.json({
      success: true,
      data: {
        riders: riders.map(rider => ({
          _id: rider._id,
          name: rider.profile?.firstName && rider.profile?.lastName 
            ? `${rider.profile.firstName} ${rider.profile.lastName}`
            : rider.businessName || rider.email,
          phone: rider.profile?.phone,
          vehicleType: rider.vehicleType,
          vehicleNumber: rider.vehicleNumber,
          isOnline: rider.isOnline
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching available riders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available riders',
      error: error.message
    });
  }
};

/**
 * Get available partners for assignment
 * GET /api/orders/available-partners
 */
const getAvailablePartners = async (req, res) => {
  try {
    const partners = await User.find({
      role: 'partner',
      isActive: true
    }).select('businessName profile firstName lastName phone location operatingHours');

    res.json({
      success: true,
      data: {
        partners: partners.map(partner => ({
          _id: partner._id,
          name: partner.businessName || `${partner.profile?.firstName || ''} ${partner.profile?.lastName || ''}`.trim() || partner.email,
          phone: partner.profile?.phone,
          location: partner.location,
          operatingHours: partner.operatingHours
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching available partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available partners',
      error: error.message
    });
  }
};

module.exports = {
  assignRider,
  assignPartner,
  confirmOrder,
  getAvailableRiders,
  getAvailablePartners
};
