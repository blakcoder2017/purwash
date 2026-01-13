const Order = require('../models/Order');
const Config = require('../models/config');
const paystack = require('../utils/paystack');
const { calculateOrderTotal } = require('../utils/priceCalculator');

exports.createOrder = async (req, res) => {
  try {
    const { client, items } = req.body;
    
    // 1. Fetch current fees from Database
    const config = await Config.findOne() || { 
      serviceFeePercent: 9, 
      deliveryFeeFlat: 10, 
      systemPerItemFee: 1 
    };

    // 2. Calculate Pricing
    const pricing = calculateOrderTotal(items, config);

    // 3. Generate Unique 6-digit ID with Retry Logic
    let order;
    let attempts = 0;
    while (attempts < 5) {
      try {
        const friendlyId = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 4. Initialize Paystack Transaction
        // We initialize here to get the reference before saving the order
        const paystackRes = await paystack.post('/transaction/initialize', {
          email: `order_${friendlyId}@wewash.com`, // Ghost email for Paystack
          amount: Math.round(pricing.totalAmount * 100), // Pesewas
          currency: "GHS",
          metadata: { friendlyId, custom_fields: [{ display_name: "Order ID", variable_name: "order_id", value: friendlyId }] }
        });

        order = new Order({
          friendlyId,
          client,
          items,
          pricing,
          paymentDetails: {
            reference: paystackRes.data.data.reference,
            status: 'pending'
          }
        });

        await order.save();
        
        return res.status(201).json({
          success: true,
          orderId: order.friendlyId,
          paymentUrl: paystackRes.data.data.authorization_url
        });

      } catch (err) {
        if (err.code === 11000) { attempts++; continue; } // Collision retry
        throw err;
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderTracking = async (req, res) => {
  const order = await Order.findOne({ friendlyId: req.params.friendlyId })
    .select('friendlyId status pricing client.location createdAt');
  
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
};

exports.initializePayment = async (req, res) => {
  try {
    const { orderId, email } = req.body;
    
    const order = await Order.findOne({ _id: orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Re-initialize payment if needed
    const paystackRes = await paystack.post('/transaction/initialize', {
      email: email || `order_${order.friendlyId}@wewash.com`,
      amount: Math.round(order.pricing.totalAmount * 100),
      currency: "GHS",
      metadata: { 
        friendlyId: order.friendlyId,
        custom_fields: [{ 
          display_name: "Order ID", 
          variable_name: "order_id", 
          value: order.friendlyId 
        }] 
      }
    });

    res.json({
      authorization_url: paystackRes.data.data.authorization_url,
      reference: paystackRes.data.data.reference
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};