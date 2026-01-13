const paystack = require('../utils/paystack');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLogs');

// Initialize payment for an order
exports.initializePayment = async (req, res) => {
  try {
    const { orderId, email } = req.body;
    
    const order = await Order.findOne({ _id: orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Initialize payment with Paystack
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

/**
 * Initializes a Paystack transaction with a multi-split between Rider and Laundry.
 * @param {Object} order - The Order document
 * @param {Object} rider - The Rider User document
 * @param {Object} laundry - The Laundry User document
 */
exports.initializeSplitPayment = async (order, rider, laundry) => {
  try {
    // 1. Paystack expects amount in Pesewas (GHS 1.00 = 100 Pesewas)
    const totalAmountPesewas = Math.round(order.pricing.totalAmount * 100);
    
    // 2. Prepare the Split Object
    // Rider share: Delivery Fee
    // Laundry share: Items Subtotal
    // Platform share: Remaining balance (Service Fee + System Fee)
    const splitData = {
      type: "flat",
      bearer_type: "account", // Platform bears the Paystack transaction fee (Senior Tip: Keeps partners happy)
      subaccounts: [
        {
          subaccount: rider.paymentInfo.paystackSubaccountCode,
          share: Math.round(order.pricing.deliveryFee * 100)
        },
        {
          subaccount: laundry.paymentInfo.paystackSubaccountCode,
          share: Math.round(order.pricing.itemsSubtotal * 100)
        }
      ]
    };

    // 3. Call Paystack Initialize
    const response = await paystack.post('/transaction/initialize', {
      email: `order_${order.friendlyId}@wewash.com`, // Ghost email for ghost identity
      amount: totalAmountPesewas,
      currency: "GHS",
      reference: order.paymentDetails.reference,
      callback_url: `${process.env.FRONTEND_URL}/track/${order.friendlyId}?payment=success`,
      metadata: {
        orderId: order._id,
        friendlyId: order.friendlyId,
        riderId: rider._id,
        laundryId: laundry._id
      },
      split: splitData
    });

    // 4. Log the initialization for the Audit Trail
    await AuditLog.create({
      action: 'ORDER_STATUS_CHANGE',
      orderId: order._id,
      metadata: { 
        event: 'payment_initialized', 
        total: order.pricing.totalAmount,
        split: splitData 
      }
    });

    return response.data.data; // Contains authorization_url and reference

  } catch (error) {
    console.error("Paystack Initialization Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Could not initialize payment with Paystack");
  }
};

// Handle Paystack webhook for payment notifications
exports.handlePaystackWebhook = async (req, res) => {
  try {
    const event = req.body;
    
    // Verify webhook signature (you should implement this)
    // const hash = req.headers['x-paystack-signature'];
    // if (!verifyWebhookSignature(hash, JSON.stringify(event))) {
    //   return res.status(401).json({ message: 'Invalid signature' });
    // }

    console.log('Paystack webhook received:', event);

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        // Payment was successful
        const { reference, amount } = event.data;
        
        // Find order by payment reference
        const Order = require('../models/Order');
        const order = await Order.findOne({ 'paymentDetails.reference': reference });
        
        if (order) {
          order.paymentDetails.status = 'success';
          order.paymentDetails.paidAt = new Date();
          await order.save();
          
          console.log(`Payment successful for order ${order.friendlyId}`);
        }
        break;
        
      case 'charge.failed':
        // Payment failed
        const failedReference = event.data.reference;
        const failedOrder = await Order.findOne({ 'paymentDetails.reference': failedReference });
        
        if (failedOrder) {
          failedOrder.paymentDetails.status = 'failed';
          await failedOrder.save();
          
          console.log(`Payment failed for order ${failedOrder.friendlyId}`);
        }
        break;
        
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};