const Client = require('../models/Client');
const Order = require('../models/Order');

/**
 * Get client by phone number with auto-creation option
 * GET /api/clients/:phone
 * Query params: ?create=true (auto-create if not found)
 */
const getClientByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    const { create = false, name } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    let client = await Client.findOne({ phone });
    
    if (!client) {
      // Auto-create client if requested
      if (create === 'true') {
        try {
          client = new Client({
            phone,
            name: name || 'Customer'
          });
          await client.save();
          console.log(`✅ Auto-created new client: ${phone}`);
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: 'Failed to create client',
            error: error.message
          });
        }
      } else {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }
    }

    // Get client's recent orders for better UX
    const recentOrders = await Order.find({ 
      'client.clientId': client._id,
      status: { $nin: ['delivered', 'cancelled'] }
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .select('friendlyId status totalAmount createdAt');

    res.json({
      success: true,
      data: {
        ...client.toObject(),
        recentOrders: recentOrders || [],
        isActive: true,
        isNewClient: !client.createdAt || (Date.now() - client.createdAt.getTime() < 60000) // Created within last minute
      }
    });

  } catch (error) {
    console.error('❌ Get client by phone failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get client',
      error: error.message
    });
  }
};

/**
 * Get client's order history
 * GET /api/clients/:phone/orders
 */
const getClientOrders = async (req, res) => {
  try {
    const { phone } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Find client first
    const client = await Client.findOne({ phone });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Build query
    const query = { 'client.clientId': client._id };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('friendlyId status pricing.itemsSubtotal pricing.totalAmount createdAt items location');

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        client: {
          _id: client._id,
          phone: client.phone,
          name: client.name,
          totalOrders: client.totalOrders,
          totalSpent: client.totalSpent
        },
        orders: orders.map(order => ({
          _id: order._id,
          friendlyId: order.friendlyId,
          status: order.status,
          items: order.items,
          subtotal: order.pricing.itemsSubtotal,
          totalAmount: order.pricing.totalAmount,
          location: order.location,
          createdAt: order.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get client orders failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get client orders',
      error: error.message
    });
  }
};

/**
 * Update client profile
 * PATCH /api/clients/:phone
 */
const updateClientProfile = async (req, res) => {
  try {
    const { phone } = req.params;
    const { name, email, preferences } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const client = await Client.findOne({ phone });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Update allowed fields
    if (name) client.name = name;
    if (email) client.email = email;
    if (preferences) {
      client.preferences = { ...client.preferences, ...preferences };
    }

    await client.save();

    res.json({
      success: true,
      message: 'Client profile updated successfully',
      data: client
    });

  } catch (error) {
    console.error('❌ Update client profile failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update client profile',
      error: error.message
    });
  }
};

/**
 * Add saved location
 * POST /api/clients/:phone/locations
 */
const addSavedLocation = async (req, res) => {
  try {
    const { phone } = req.params;
    const { label, address, coordinates, isDefault } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    if (!label || !address) {
      return res.status(400).json({
        success: false,
        message: 'Label and address are required'
      });
    }

    const client = await Client.findOne({ phone });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    await client.addSavedLocation({
      label,
      address,
      coordinates: coordinates || { lat: 0, lng: 0 },
      isDefault: isDefault || false
    });

    res.json({
      success: true,
      message: 'Location saved successfully',
      data: client.savedLocations
    });

  } catch (error) {
    console.error('❌ Add saved location failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add saved location',
      error: error.message
    });
  }
};

/**
 * Get client statistics
 * GET /api/clients/:phone/stats
 */
const getClientStats = async (req, res) => {
  try {
    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const client = await Client.findOne({ phone });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Get order statistics
    const orderStats = await Order.aggregate([
      { $match: { 'client.clientId': client._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$pricing.totalAmount' }
        }
      }
    ]);

    // Get monthly spending trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySpending = await Order.aggregate([
      {
        $match: {
          'client.clientId': client._id,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalAmount: { $sum: '$pricing.totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        client: {
          _id: client._id,
          phone: client.phone,
          name: client.name,
          totalOrders: client.totalOrders,
          totalSpent: client.totalSpent,
          averageOrderValue: client.averageOrderValue,
          lastOrderDate: client.lastOrderDate,
          savedLocations: client.savedLocations.length,
          preferences: client.preferences
        },
        orderStats,
        monthlySpending
      }
    });

  } catch (error) {
    console.error('❌ Get client stats failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get client statistics',
      error: error.message
    });
  }
};

/**
 * Delete saved location
 * DELETE /api/clients/:phone/locations/:locationId
 */
const deleteSavedLocation = async (req, res) => {
  try {
    const { phone, locationId } = req.params;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const client = await Client.findOne({ phone });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Remove location by index (since we don't have individual location IDs)
    const locationIndex = parseInt(locationId);
    if (locationIndex >= 0 && locationIndex < client.savedLocations.length) {
      client.savedLocations.splice(locationIndex, 1);
      await client.save();
    }

    res.json({
      success: true,
      message: 'Location deleted successfully',
      data: client.savedLocations
    });

  } catch (error) {
    console.error('❌ Delete saved location failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete saved location',
      error: error.message
    });
  }
};

module.exports = {
  getClientByPhone,
  getClientOrders,
  updateClientProfile,
  addSavedLocation,
  getClientStats,
  deleteSavedLocation
};
