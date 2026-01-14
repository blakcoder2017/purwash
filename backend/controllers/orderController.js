const Order = require('../models/Order');
const Client = require('../models/Client');
const LaundryItem = require('../models/LaundryItem');
const Config = require('../models/config');
const Commission = require('../models/Commission');
const axios = require('axios');
const mongoose = require('mongoose');

/**
 * Pricing Configuration from Database
 * Falls back to environment variables if database config is not available
 */
const getPricingConfig = async () => {
  try {
    const config = await Config.findOne();
    if (config) {
      return {
        platformFeePercentage: config.platformFeePercentage,
        deliveryFee: config.deliveryFee,
        platformPerItemFee: config.platformPerItemFee,
        minOrderAmount: config.minOrderAmount
      };
    }
  } catch (error) {
    console.warn('Could not fetch config from database, using defaults');
  }
  
  // Fallback to defaults
  return {
    platformFeePercentage: 9,
    deliveryFee: 10,
    platformPerItemFee: 1,
    minOrderAmount: 5
  };
};

/**
 * Calculate order pricing breakdown
 * @param {Array} items - Array of laundry items with prices
 * @returns {Object} Detailed pricing breakdown
 */
const calculateOrderPricing = async (items) => {
  // Get current pricing configuration
  const config = await getPricingConfig();
  
  // Calculate items subtotal
  const itemsSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Check minimum order amount
  if (itemsSubtotal < config.minOrderAmount) {
    throw new Error(`Minimum order amount is ₵${config.minOrderAmount}. Current subtotal: ₵${itemsSubtotal}`);
  }
  
  // Convert everything to Pesewas for accurate calculations
  const baseCostPesewas = Math.round(itemsSubtotal * 100);
  const deliveryFeePesewas = Math.round(config.deliveryFee * 100);
  const platformItemFeePesewas = Math.round(config.platformPerItemFee * 100);
  
  // Calculate platform percentage fee (9% of base cost)
  const platformPercentageFeePesewas = Math.round(baseCostPesewas * (config.platformFeePercentage / 100));
  
  // Calculate total item commission (₵1 per item)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalItemCommissionPesewas = itemCount * platformItemFeePesewas;
  
  // Calculate total client pays
  const totalClientPayPesewas = baseCostPesewas + platformPercentageFeePesewas + deliveryFeePesewas;
  
  // Convert back to GHS for display
  const pricing = {
    itemsSubtotal: itemsSubtotal,
    platformFee: platformPercentageFeePesewas / 100,
    deliveryFee: deliveryFeePesewas / 100,
    platformPerItemFee: platformItemFeePesewas / 100,
    totalAmount: totalClientPayPesewas / 100,
    // Additional breakdown for settlements
    settlements: {
      platformRevenue: (platformPercentageFeePesewas + totalItemCommissionPesewas) / 100,
      riderPayout: deliveryFeePesewas / 100,
      partnerPayout: (baseCostPesewas - totalItemCommissionPesewas) / 100
    },
    breakdown: {
      baseCost: itemsSubtotal,
      platformPercentageFee: platformPercentageFeePesewas / 100,
      platformItemCommission: totalItemCommissionPesewas / 100,
      deliveryFee: deliveryFeePesewas / 100,
      totalClientPay: totalClientPayPesewas / 100
    },
    config: config
  };
  
  return pricing;
};

/**
 * Create commissions for confirmed order
 * @param {Object} order - Order document
 * @param {String} confirmedBy - Who confirmed the order ('client' or 'admin')
 */
const createOrderCommissions = async (order, confirmedBy = 'client') => {
  try {
    // Only create commissions if order has payment success and is confirmed
    if (order.paymentDetails.status !== 'success') {
      console.log('❌ Order payment not successful, skipping commission creation');
      return;
    }

    if (!order.isConfirmedByClient && !order.isAdminConfirmed) {
      console.log('❌ Order not confirmed, skipping commission creation');
      return;
    }

    // Create commissions using the Commission model
    const commissions = await Commission.createOrderCommissions(order, confirmedBy);
    console.log(`✅ Created ${commissions.length} commissions for order ${order.friendlyId}`);
    
    return commissions;
  } catch (error) {
    console.error('❌ Error creating commissions:', error);
    throw error;
  }
};

/**
 * Verify Paystack payment
 * @param {string} reference - Paystack transaction reference
 * @returns {Object} Payment verification result
 */
const verifyPaystackPayment = async (reference) => {
  try {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured in environment variables');
    }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const { data } = response.data;
    
    if (data.status !== 'success') {
      throw new Error('Payment was not successful');
    }

    return {
      success: true,
      amount: data.amount / 100, // Convert from kobo to GHS
      currency: data.currency,
      paidAt: data.paid_at,
      customer: data.customer
    };
    
  } catch (error) {
    console.error('Paystack verification error:', error.response?.data || error.message);
    throw new Error(`Payment verification failed: ${error.message}`);
  }
};

/**
 * Generate simple order code (4-6 digit alphanumeric)
 * @returns {string} Order code (e.g., "W7K4" or "LW-5821")
 */
const generateOrderCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = Math.floor(Math.random() * 3) + 4; // 4-6 characters
  let code = '';
  
  for (let i = 0; i < codeLength; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Add prefix for better branding
  const prefixes = ['WASH-', 'PW-', 'LW-'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  
  return prefix + code;
};

/**
 * Create Order - Guest Checkout with Auto-Generated Code
 * POST /api/orders
 */
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    // Start transaction
    await session.withTransaction(async () => {
      const { 
        items, 
        phone, 
        clientName, 
        location, 
        paymentMethod = 'momo', // Default to mobile money
        pickupTime,
        paystackReference // Optional for Paystack payments
      } = req.body;

      // Validate required fields
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error('Items array is required and cannot be empty');
      }
      
      if (!phone) {
        throw new Error('Phone number is required');
      }
      
      if (!location || !location.addressName) {
        throw new Error('Location information is required');
      }

      // For Paystack payments, verify payment
      if (paymentMethod === 'momo' && paystackReference) {
        console.log('🔍 Verifying payment with Paystack...');
        const paymentVerification = await verifyPaystackPayment(paystackReference);
        
        // Calculate pricing
        const pricing = await calculatePricing(items);
        
        // Verify payment amount matches our calculation
        if (Math.abs(paymentVerification.amount - pricing.totalAmount) > 1) {
          throw new Error(`Payment amount mismatch. Expected: ₵${pricing.totalAmount}, Paid: ₵${paymentVerification.amount}`);
        }
      }

      // Step 1: Generate unique order code
      const orderCode = generateOrderCode();
      
      // Step 2: Calculate pricing
      console.log('💰 Calculating order pricing...');
      const pricing = await calculatePricing(items);

      // Step 3: Handle soft client creation (invisible to user)
      console.log('👤 Processing soft client creation...');
      let client;
      
      try {
        // Simple approach: find or create without using the problematic static method
        client = await Client.findOne({ phone });
        
        if (!client) {
          console.log('Creating new client...');
          client = new Client({
            phone,
            name: clientName || 'Customer'
          });
          await client.save();
          console.log(`✅ New client created: ${client._id}`);
        } else {
          console.log(`✅ Existing client found: ${client._id}`);
          // Update name if different
          if (clientName && client.name !== clientName) {
            client.name = clientName;
            await client.save();
          }
        }
      } catch (error) {
        throw new Error(`Client processing failed: ${error.message}`);
      }

      // Step 4: Create order with simplified structure
      console.log('📦 Creating order...');
      const orderData = {
        friendlyId: orderCode,
        code: orderCode, // Simple tracking code
        client: {
          clientId: client._id,
          phone: phone,
          clientName: clientName || client.name,
          location: {
            addressName: location.addressName,
            coordinates: location.coordinates || { lat: 0, lng: 0 }
          }
        },
        items: items,
        pricing: {
          itemsSubtotal: pricing.baseCost,
          serviceFee: pricing.platformPercentageFee + pricing.platformItemCommission,
          deliveryFee: pricing.deliveryFee,
          systemFee: 0, // Simplified
          totalAmount: pricing.totalAmount
        },
        status: 'created', // Use valid enum value
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'cash' ? 'pending' : 'success',
        pickupTime: pickupTime || new Date(Date.now() + 2 * 60 * 60 * 1000), // Default 2 hours
        createdAt: new Date(),
        // Add required paymentDetails for schema compatibility
        paymentDetails: {
          reference: paystackReference || `CASH-${orderCode}`, // Generate reference for cash orders
          channel: paymentMethod === 'momo' ? 'mobile_money' : 'card', // Use valid enum values
          status: paymentMethod === 'cash' ? 'pending' : 'success',
          amount: pricing.totalAmount,
          paidAt: paymentMethod === 'momo' && paystackReference ? new Date() : undefined
        }
      };

      const order = new Order(orderData);
      await order.save({ session });

      // Step 5: Update client stats (soft account)
      await Client.findByIdAndUpdate(
        client._id,
        { 
          $inc: { totalOrders: 1, totalSpent: pricing.totalAmount },
          $set: { lastOrderDate: new Date() }
        },
        { session }
      );

      // Step 6: Save location for future convenience
      if (location.addressName) {
        await Client.findByIdAndUpdate(
          client._id,
          {
            $push: {
              savedLocations: {
                label: 'Default Pickup',
                address: location.addressName,
                coordinates: location.coordinates || { lat: 0, lng: 0 },
                isDefault: true,
                createdAt: new Date()
              }
            }
          },
          { session }
        );
      }

      console.log(`✅ Order created: ${orderCode}`);

      res.status(201).json({
        success: true,
        data: {
          order: {
            friendlyId: orderCode,
            code: orderCode,
            status: order.status,
            totalAmount: pricing.totalAmount,
            pickupTime: order.pickupTime,
            phone: phone
          },
          message: `Order placed successfully! Your order code is: ${orderCode}`,
          trackingCode: orderCode
        }
      });
    });

  } catch (error) {
    console.error('❌ Order creation failed:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  } finally {
    await session.endSession();
  }
};

/**
 * Track Order by Phone and Code - No Login Required
 * GET /api/orders/track/:phone/:code
 */
const trackOrderByPhoneAndCode = async (req, res) => {
  try {
    const { phone, code } = req.params;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and order code are required'
      });
    }

    // Find order by phone and code
    const order = await Order.findOne({
      'client.phone': phone,
      $or: [
        { friendlyId: code },
        { code: code }
      ]
    })
    .populate('client.clientId', 'name phone totalOrders');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Calculate ETA based on status
    let eta = null;
    const now = new Date();
    
    switch (order.status) {
      case 'created':
        eta = new Date(order.pickupTime || now.getTime() + 2 * 60 * 60 * 1000);
        break;
      case 'on_my_way_to_pick':
        eta = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes for pickup
        break;
      case 'picked_up':
        eta = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours for washing
        break;
      case 'washing':
        eta = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours remaining
        break;
      case 'ready_for_pick':
        eta = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour for delivery
        break;
      case 'out_for_delivery':
        eta = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
        break;
      default:
        eta = null;
    }

    res.json({
      success: true,
      data: {
        order: {
          friendlyId: order.friendlyId,
          code: order.code,
          status: order.status,
          totalAmount: order.pricing.totalAmount,
          pickupTime: order.pickupTime,
          createdAt: order.createdAt,
          items: order.items,
          location: order.client.location, // Use client location
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus
        },
        client: order.client.clientId,
        rider: null, // No rider assigned yet
        eta: eta,
        statusMessage: getStatusMessage(order.status)
      }
    });

  } catch (error) {
    console.error('❌ Track order failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track order'
    });
  }
};

/**
 * Get status message for order
 */
const getStatusMessage = (status) => {
  const messages = {
    created: '📦 Order placed - Waiting for pickup',
    assigned: '📋 Rider assigned to your order',
    on_my_way_to_pick: '🚴 Rider is on the way to pickup',
    picked_up: '🚴 Rider has picked up your laundry',
    dropped_at_laundry: '🏢 Laundry received at facility',
    washing: '🧼 Your laundry is being washed',
    ready_for_pick: '✅ Laundry ready for delivery',
    out_for_delivery: '🚚 Rider is on the way with your clean laundry',
    delivered: '🎉 Order delivered successfully',
    cancelled: '❌ Order cancelled'
  };
  
  return messages[status] || '📦 Processing your order';
};

/**
 * Get pricing breakdown before payment
 * POST /api/orders/calculate
 */
const calculateOrderPricingHandler = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required'
      });
    }

    const pricing = await calculatePricing(items);

    res.json({
      success: true,
      data: {
        baseCost: pricing.baseCost,
        platformPercentageFee: pricing.platformPercentageFee,
        platformItemCommission: pricing.platformItemCommission,
        deliveryFee: pricing.deliveryFee,
        totalAmount: pricing.totalAmount,
        config: pricing.config
      }
    });

  } catch (error) {
    console.error('❌ Price calculation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate price',
      error: error.message
    });
  }
};

/**
 * Calculate pricing for order items
 */
const calculatePricing = async (items) => {
  const config = await getPricingConfig();
  
  // Calculate base cost
  const itemsSubtotal = items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  // Calculate fees
  const platformPercentageFee = (itemsSubtotal * config.platformFeePercentage) / 100;
  const platformItemCommission = items.length * config.platformPerItemFee;
  const deliveryFee = config.deliveryFee;
  
  const totalAmount = itemsSubtotal + platformPercentageFee + platformItemCommission + deliveryFee;

  return {
    baseCost: itemsSubtotal,
    platformPercentageFee,
    platformItemCommission,
    deliveryFee,
    totalAmount,
    config,
    breakdown: {
      items: itemsSubtotal,
      delivery: deliveryFee,
      system: `(${config.platformFeePercentage}% + ₵${config.platformPerItemFee} per item)`,
      perItem: `₵${config.platformPerItemFee} × ${items.length}`,
      total: totalAmount
    }
  };
};

/**
 * Get order by ID
 */
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const order = await Order.findOne({ friendlyId: orderId })
      .populate('client.clientId', 'name phone')
      .populate('riderId', 'name phone vehicleNumber');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('❌ Get order failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order',
      error: error.message
    });
  }
};

/**
 * Track orders by phone number (legacy)
 */
const trackByPhone = async (req, res) => {
  try {
    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    console.log(`🔍 Tracking orders for phone: ${phone}`);

    // Find client first
    const client = await Client.findOne({ phone });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'No client found with this phone number'
      });
    }

    // Find orders for this client
    const orders = await Order.find({ 
      'client.clientId': client._id,
      status: { $nin: ['delivered', 'cancelled'] }
    })
    .sort({ createdAt: -1 })
    .select('friendlyId status pricing.itemsSubtotal pricing.totalAmount createdAt items location');

    // Ensure all orders have items array (defensive programming)
    const ordersWithItems = orders.map(order => ({
      ...order.toObject(),
      items: order.items || []
    }));

    if (ordersWithItems.length === 0) {
      return res.json({
        success: true,
        message: 'No active orders found',
        data: {
          client: {
            _id: client._id,
            phone: client.phone,
            name: client.name,
            totalOrders: client.totalOrders
          },
          orders: []
        }
      });
    }

    res.json({
      success: true,
      message: `Found ${ordersWithItems.length} active order(s)`,
      data: {
        client: {
          _id: client._id,
          phone: client.phone,
          name: client.name,
          totalOrders: client.totalOrders,
          totalSpent: client.totalSpent
        },
        orders: ordersWithItems.map(order => ({
          _id: order._id,
          friendlyId: order.friendlyId,
          status: order.status,
          items: order.items,
          subtotal: order.pricing.itemsSubtotal,
          totalAmount: order.pricing.totalAmount,
          location: order.location,
          createdAt: order.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('❌ Order tracking failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track orders',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  trackOrderByPhoneAndCode,
  calculateOrderPricingHandler,
  getOrderById,
  trackByPhone,
  verifyPaystackPayment
};
