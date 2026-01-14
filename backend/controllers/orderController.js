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
 * Generate friendly order ID
 * @returns {string} Friendly order ID (e.g., "WASH-8291")
 */
const generateFriendlyId = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `WASH-${randomNum}`;
};

/**
 * Create Order - Main endpoint for seamless client onboarding
 * POST /api/orders
 */
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    // Start transaction
    await session.withTransaction(async () => {
      const { items, phone, clientName, location, paystackReference } = req.body;

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
      
      if (!paystackReference) {
        throw new Error('Paystack reference is required');
      }

      // Step 1: Verify payment with Paystack
      console.log('🔍 Verifying payment with Paystack...');
      const paymentVerification = await verifyPaystackPayment(paystackReference);
      
      // Step 2: Calculate pricing
      console.log('💰 Calculating order pricing...');
      const pricing = await calculatePricing(items);
      
      // Verify payment amount matches our calculation
      if (Math.abs(paymentVerification.amount - pricing.totalAmount) > 1) {
        throw new Error(`Payment amount mismatch. Expected: ₵${pricing.totalAmount}, Paid: ₵${paymentVerification.amount}`);
      }

      // Step 3: Handle client auto-onboarding
      console.log('👤 Processing client auto-onboarding...');
      let client;
      
      try {
        client = await Client.findOrCreateByPhone(phone, clientName);
        console.log(`✅ Client ${client._id} ${client.isNew ? 'created' : 'found'}`);
      } catch (error) {
        throw new Error(`Client processing failed: ${error.message}`);
      }

      // Step 4: Create order
      console.log('📦 Creating order...');
      const friendlyId = generateFriendlyId();
      
      const orderData = {
        friendlyId,
        client: {
          clientId: client._id,
          phone: client.phone,
          name: client.name
        },
        items: items.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        location: {
          addressName: location.addressName,
          coordinates: location.coordinates || { lat: 0, lng: 0 }
        },
        pricing: {
          itemsSubtotal: pricing.itemsSubtotal,
          serviceFee: pricing.serviceFee,
          deliveryFee: pricing.deliveryFee,
          systemFee: pricing.systemFee,
          totalAmount: pricing.totalAmount
        },
        paymentDetails: {
          reference: paystackReference,
          channel: 'paystack',
          status: 'paid',
          paidAt: new Date(paymentVerification.paidAt),
          amount: pricing.totalAmount
        },
        status: 'created',
        convertedToClientOrder: true,
        isGuestOrder: false,
        createdAt: new Date()
      };

      const order = new Order(orderData);
      await order.save({ session });

      // Step 5: Update client statistics
      await client.updateOrderStats(pricing.totalAmount);

      // Step 6: Add location to client's saved locations if not already saved
      if (location.saveAsLocation) {
        await client.addSavedLocation({
          label: location.locationLabel || 'Home',
          address: location.addressName,
          coordinates: location.coordinates,
          isDefault: client.savedLocations.length === 0
        });
      }

      // Step 7: Create commissions if order is confirmed (auto-confirm for seamless client)
      // Since this is a seamless client strategy, we auto-confirm the order
      order.isConfirmedByClient = true;
      order.confirmedAt = new Date();
      await order.save({ session });
      
      // Create commissions for rider and partner (if assigned)
      // Note: Commissions will be created when rider/partner are assigned later
      await createOrderCommissions(order, 'client');

      console.log(`✅ Order ${friendlyId} created and confirmed successfully`);

      // Return success response with full breakdown
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          order: {
            _id: order._id,
            friendlyId: order.friendlyId,
            status: order.status,
            totalAmount: order.pricing.totalAmount,
            createdAt: order.createdAt
          },
          client: {
            _id: client._id,
            phone: client.phone,
            name: client.name,
            totalOrders: client.totalOrders
          },
          pricing: pricing.breakdown,
          config: pricing.config,
          payment: {
            reference: paystackReference,
            amount: pricing.totalAmount,
            status: 'paid',
            paidAt: paymentVerification.paidAt
          }
        }
      });
    });

  } catch (error) {
    console.error('❌ Order creation failed:', error);
    
    // Handle specific error types
    if (error.message.includes('Payment verification failed')) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        error: error.message
      });
    }
    
    if (error.message.includes('Payment amount mismatch')) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount does not match order total',
        error: error.message
      });
    }
    
    if (error.message.includes('Minimum order amount')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
    
    if (error.message.includes('duplicate key')) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate phone number or order reference',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Order creation failed',
      error: error.message
    });
  } finally {
    await session.endSession();
  }
};

/**
 * Track orders by phone number
 * GET /api/orders/track/:phone
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

    if (orders.length === 0) {
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
      message: `Found ${orders.length} active order(s)`,
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

    const pricing = await calculateOrderPricing(items);

    res.json({
      success: true,
      data: {
        pricing: pricing.breakdown,
        config: pricing.config,
        totalAmount: pricing.totalAmount
      }
    });

  } catch (error) {
    console.error('❌ Pricing calculation failed:', error);
    
    if (error.message.includes('Minimum order amount')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to calculate pricing',
      error: error.message
    });
  }
};

/**
 * Get order details by ID
 * GET /api/orders/:orderId
 */
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('client.clientId', 'phone name email');

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

module.exports = {
  createOrder,
  trackByPhone,
  calculateOrderPricing: calculateOrderPricingHandler,
  getOrderById
};