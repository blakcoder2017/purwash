const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/User');
const Commission = require('../models/Commission');

/**
 * Verify Paystack webhook signature
 */
const verifyWebhookSignature = (payload, signature) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return hash === signature;
};

/**
 * Handle Paystack payment webhooks
 */
exports.handlePaystackWebhook = async (req, res) => {
  try {
    const event = req.body;
    const signature = req.headers['x-paystack-signature'];
    
    // Verify webhook signature
    if (!verifyWebhookSignature(event, signature)) {
      console.log('Webhook signature verification failed');
      return res.status(401).json({ message: 'Invalid signature' });
    }
    
    console.log('Webhook received:', event.event);
    
    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleSuccessfulCharge(event.data);
        break;
        
      case 'charge.failed':
        await handleFailedCharge(event.data);
        break;
        
      case 'transfer.success':
      case 'transfer.failed':
      case 'transfer.reversed':
        console.log('Transfer event received (ignored):', event.event);
        break;
        
      default:
        console.log('Unhandled webhook event:', event.event);
    }
    
    res.status(200).json({ message: 'Webhook processed successfully' });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Handle successful payment charge
 */
const handleSuccessfulCharge = async (chargeData) => {
  try {
    const { reference, amount, customer, metadata } = chargeData;
    
    console.log('Processing successful charge:', reference);
    
    // Find order by reference
    const order = await Order.findOne({ 'paymentDetails.reference': reference });
    
    if (order) {
      // Update order status
      order.paymentDetails.status = 'success';
      order.paymentDetails.paidAt = new Date(chargeData.paid_at);
      order.paymentDetails.channel = chargeData.channel;
      order.status.type = 'assigned'; // Move to next step after payment
      
      await order.save();
      
      // Create commissions for this order
      try {
        console.log('Creating commissions for order:', order._id);
        await Commission.createOrderCommissions(order, 'client');
        console.log('Commissions created successfully');
      } catch (commissionError) {
        console.error('Error creating commissions:', commissionError);
        // Don't fail the webhook, but log the error
      }
      
      // Update rider stats if applicable
      if (order.rider) {
        const rider = await User.findById(order.rider);
        if (rider) {
          rider.wallet.totalEarned += amount / 100;
          rider.wallet.pendingBalance += amount / 100;
          await rider.save();
        }
      }
      
      console.log(`Order ${reference} marked as paid and commissions created`);
      
      // TODO: Send notification to client
      // TODO: Send notification to rider/partner
      
    } else {
      console.log('Order not found for reference:', reference);
    }
    
  } catch (error) {
    console.error('Error handling successful charge:', error);
  }
};

/**
 * Handle failed payment charge
 */
const handleFailedCharge = async (chargeData) => {
  try {
    const { reference, amount, customer, metadata } = chargeData;
    
    console.log('Processing failed charge:', reference);
    
    // Find order by reference
    const order = await Order.findOne({ 'paymentDetails.reference': reference });
    
    if (order) {
      // Update order status
      order.paymentDetails.status = 'failed';
      order.status.type = 'created'; // Reset to created state
      
      await order.save();
      
      console.log(`Order ${reference} marked as failed`);
      
      // TODO: Send notification to client about payment failure
      
    } else {
      console.log('Order not found for reference:', reference);
    }
    
  } catch (error) {
    console.error('Error handling failed charge:', error);
  }
};

// Transfer webhook handlers intentionally disabled for payouts.

/**
 * Test webhook endpoint for development
 */
exports.testWebhook = (req, res) => {
  res.json({
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    body: req.body
  });
};
