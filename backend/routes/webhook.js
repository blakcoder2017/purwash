// routes/webhook.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');

router.post('/paystack/webhook', async (req, res) => {
  // 1. Verify this request actually came from Paystack
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
                     .update(JSON.stringify(req.body))
                     .digest('hex');
                     
  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;
  if (event.event === 'charge.success') {
    const reference = event.data.reference;
    
    // 2. Update the Order in MongoDB
    await Order.findOneAndUpdate(
      { 'paymentDetails.reference': reference },
      { 
        'paymentDetails.status': 'success',
        'paymentDetails.paidAt': event.data.paid_at,
        'paymentDetails.channel': event.data.channel
      }
    );
    
    // 3. Trigger notification to Admin to assign a Rider!
    console.log(`Payment successful for order ref: ${reference}`);
  }

  res.sendStatus(200); // Always tell Paystack you got it
});

module.exports = router;