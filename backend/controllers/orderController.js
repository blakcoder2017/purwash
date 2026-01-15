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
 * Calculate order pricing breakdown (Legacy/Internal version)
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
    // Safety Check: Ensure Commission model is loaded
    if (!Commission) {
        console.error('❌ Commission model missing');
        return;
    }
    
    // Only create commissions if payment is successful
    if (order.paymentDetails.status !== 'success') {
      console.log('❌ Order payment not successful, skipping commissions');
      return;
    }

    const commissions = await Commission.createOrderCommissions(order, confirmedBy);
    console.log(`✅ Created ${commissions.length} commissions for order ${order.friendlyId}`);
    return commissions;
  } catch (error) {
    console.error('❌ Error creating commissions:', error);
    // Non-blocking error: We don't want to fail the request if just stats fail
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
 * Create Order - FIXED: Removed Transaction Dependency
 * POST /api/orders
 */
const createOrder = async (req, res) => {
  // NOTE: Transactions removed to support standalone MongoDB servers
  try {
    const { 
      items, 
      phone, 
      clientName, 
      location, 
      paymentMethod = 'momo',
      pickupTime,
      paystackReference
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Items array is required and cannot be empty');
    }
    if (!phone) throw new Error('Phone number is required');
    if (!location || !location.addressName) throw new Error('Location information is required');

    // 1. Verify Payment & Pricing
    const pricing = await calculateOrderPricing(items);
    
    if (paymentMethod === 'momo' && paystackReference) {
      console.log('🔍 Verifying Paystack...');
      const verification = await verifyPaystackPayment(paystackReference);
      // Allow 1 GHS variance for rounding
      if (Math.abs(verification.amount - pricing.totalAmount) > 1) {
        throw new Error(`Amount mismatch. Expected: ₵${pricing.totalAmount}, Paid: ₵${verification.amount}`);
      }
    }

    // 2. Find or Create Client (Soft Onboarding)
    console.log('👤 Processing Client...');
    let client = await Client.findOne({ phone });
    
    if (!client) {
      // Create new client - minimal fields to avoid validation errors
      client = new Client({
        phone: phone.trim(),
        name: (clientName || 'Customer').trim(),
        savedLocations: [] // Initialize arrays empty to be safe
      });
      await client.save();
      console.log(`✅ New client created: ${client._id}`);
    } else {
      // Update existing name if changed
      if (clientName && client.name !== clientName) {
        client.name = clientName;
        await client.save();
      }
    }

    // 3. Create Order
    const orderCode = generateOrderCode();
    console.log(`📦 Creating Order ${orderCode}...`);
    
    const isPaid = paymentMethod === 'momo' && paystackReference;
    
    const order = new Order({
      friendlyId: orderCode,
      code: orderCode,
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
        systemFee: 0,
        totalAmount: pricing.totalAmount
      },
      status: 'created',
      paymentMethod: paymentMethod,
      paymentStatus: isPaid ? 'success' : 'pending',
      pickupTime: pickupTime || new Date(Date.now() + 2 * 60 * 60 * 1000),
      paymentDetails: {
        reference: paystackReference || `CASH-${orderCode}`,
        channel: paymentMethod === 'momo' ? 'mobile_money' : 'card',
        status: isPaid ? 'success' : 'pending',
        amount: pricing.totalAmount,
        paidAt: isPaid ? new Date() : undefined
      }
    });

    await order.save();

    // 4. Post-Order Actions (Update Stats & Location)
    try {
        await Client.findByIdAndUpdate(client._id, { 
            $inc: { totalOrders: 1, totalSpent: pricing.totalAmount },
            $set: { lastOrderDate: new Date() }
        });
        
        // Save location if new
        const locExists = client.savedLocations?.some(l => l.address === location.addressName);
        if (!locExists && location.addressName) {
            await Client.findByIdAndUpdate(client._id, {
                $push: { savedLocations: {
                    label: 'Pickup',
                    address: location.addressName,
                    coordinates: location.coordinates || { lat: 0, lng: 0 },
                    createdAt: new Date()
                }}
            });
        }
    } catch (updateError) {
        console.error("⚠️ Failed to update client stats:", updateError.message);
        // Do not fail the request just because stats failed
    }

    // 5. CRITICAL: Generate Commissions
    if (isPaid) {
        console.log('💸 Generating commissions...');
        await createOrderCommissions(order, 'client');
    }

    console.log('✅ Order Process Completed Successfully');

    res.status(201).json({
      success: true,
      data: {
        order: {
          friendlyId: orderCode,
          code: orderCode,
          status: order.status,
          totalAmount: pricing.totalAmount
        },
        trackingCode: orderCode,
        message: 'Order placed successfully!'
      }
    });

  } catch (error) {
    console.error('❌ Order Creation Error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
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
  
  // FIXED: Platform commission per item should NOT be added to client total
  // It is usually a deduction from partner earnings
  const platformItemCommission = items.length * config.platformPerItemFee;
  
  const deliveryFee = config.deliveryFee;
  
  // FIXED: Total Amount = Subtotal + % Fee + Delivery (Removed platformItemCommission)
  const totalAmount = itemsSubtotal + platformPercentageFee + deliveryFee;

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
      system: `(${config.platformFeePercentage}%)`, // Updated text to reflect reality
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