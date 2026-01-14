# PurWash Webhook Setup Guide

## Overview
This guide explains how to set up and test webhooks for PurWash payment processing using Paystack and ngrok for local development.

## Prerequisites

1. **Ngrok installed** (for local testing)
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Backend server running**
   ```bash
   cd backend
   npm run start:dev
   ```

3. **Paystack account** with access to dashboard

## Quick Setup

### 1. Start Webhook Tunnel

Run the automated setup script:
```bash
cd backend
./scripts/setup-webhook.sh
```

This will:
- Check if ngrok is installed
- Verify backend server is running
- Start ngrok tunnel on port 5000
- Display webhook URLs
- Provide setup instructions

### 2. Configure Paystack Webhook

1. Copy the webhook URL from the setup script output
2. Go to [Paystack Dashboard](https://dashboard.paystack.co/)
3. Navigate to **Settings → Webhooks**
4. Add the webhook URL: `https://your-ngrok-url.ngrok.io/api/webhook/paystack/webhook`
5. Select the following events:
   - ✅ `charge.success`
   - ✅ `charge.failed`
   - ✅ `transfer.success`
   - ✅ `transfer.failed`
   - ✅ `transfer.reversed`

### 3. Test the Webhook

#### Option A: Use the Test Script
```bash
cd backend
./scripts/test-webhook.js
```

#### Option B: Manual Testing
```bash
# Test health endpoint
curl https://your-ngrok-url.ngrok.io/api/webhook/health

# Test webhook endpoint
curl https://your-ngrok-url.ngrok.io/api/webhook/test
```

## Webhook Events

### charge.success
Triggered when a payment is successful.

**Payload Structure:**
```json
{
  "event": "charge.success",
  "data": {
    "reference": "PURWASH_123456",
    "amount": 5000,
    "customer": {
      "email": "customer@example.com"
    },
    "paid_at": "2024-01-13T10:00:00Z",
    "channel": "mobile_money"
  }
}
```

**Actions:**
- Updates order payment status to 'success'
- Moves order to 'assigned' status
- Updates rider wallet earnings

### charge.failed
Triggered when a payment fails.

**Actions:**
- Updates order payment status to 'failed'
- Resets order status to 'created'
- Logs failure reason

### transfer.success
Triggered when a payout to rider/partner succeeds.

**Actions:**
- Updates user wallet (total earned, pending balance)
- Records payout details
- Sends success notification

### transfer.failed
Triggered when a payout fails.

**Actions:**
- Logs failed payout
- Records failure reason
- Sends failure notification

### transfer.reversed
Triggered when a payout is reversed.

**Actions:**
- Adds reversed amount back to pending balance
- Logs reversal details
- Sends reversal notification

## Webhook Endpoints

### Production Endpoints
```
POST /api/webhook/paystack/webhook  # Main Paystack webhook
GET  /api/webhook/health             # Health check
GET  /api/webhook/test               # Test endpoint
```

### Local Development (with ngrok)
```
POST https://your-ngrok-url.ngrok.io/api/webhook/paystack/webhook
GET  https://your-ngrok-url.ngrok.io/api/webhook/health
GET  https://your-ngrok-url.ngrok.io/api/webhook/test
```

## Security

### Signature Verification
Webhooks are secured using HMAC-SHA512 signatures:

1. Paystack sends `X-Paystack-Signature` header
2. Server verifies signature using Paystack secret key
3. Invalid signatures are rejected with 401 status

### Environment Variables
```bash
# Required for webhook security
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here

# Optional for ngrok (handled by setup script)
NGROK_AUTHTOKEN=your_ngrok_auth_token
```

## Database Updates

### Order Model Updates
```javascript
// Successful payment
order.paymentDetails.status = 'success';
order.paymentDetails.paidAt = new Date();
order.status.type = 'assigned';

// Failed payment
order.paymentDetails.status = 'failed';
order.status.type = 'created';
```

### User Model Updates
```javascript
// Successful transfer
user.wallet.totalEarned += amount;
user.wallet.pendingBalance += amount;
user.wallet.lastPayout = new Date();

// Failed transfer
user.wallet.lastFailedPayout = new Date();
user.wallet.lastFailedPayoutAmount = amount;
```

## Monitoring and Debugging

### Ngrok Dashboard
Access at: http://localhost:4040

- View incoming requests
- Monitor tunnel status
- Check request/response logs

### Backend Logs
Monitor webhook processing:
```bash
# Follow webhook logs
tail -f logs/webhook.log

# Or monitor all logs
npm run start:dev
```

### Test Events
Use the test script to simulate events:
```bash
# Test specific event types
WEBHOOK_URL=https://your-url.ngrok.io/api/webhook/paystack/webhook \
node scripts/test-webhook.js
```

## Production Deployment

### Domain Requirements
- Must use HTTPS (Paystack requirement)
- Valid SSL certificate
- Static IP address (recommended)

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key
WEBHOOK_URL=https://yourdomain.com/api/webhook/paystack/webhook
```

### Security Considerations
1. Use HTTPS only
2. Validate all webhook signatures
3. Rate limit webhook endpoints
4. Log all webhook events
5. Monitor for duplicate events

## Troubleshooting

### Common Issues

#### 1. "Invalid signature" error
- Check PAYSTACK_SECRET_KEY is correct
- Ensure webhook URL matches Paystack configuration
- Verify request body isn't modified

#### 2. Ngrok tunnel not working
- Check if port 5000 is available
- Verify backend server is running
- Restart ngrok: `pkill -f ngrok && ./scripts/setup-webhook.sh`

#### 3. Webhook not received
- Check Paystack dashboard webhook configuration
- Verify ngrok tunnel is active
- Test with manual curl command

#### 4. Order not found
- Check order reference matches payment reference
- Verify order exists in database
- Check payment reference format

### Debug Commands

```bash
# Check ngrok status
curl http://localhost:4040/api/tunnels

# Test webhook health
curl https://your-ngrok-url.ngrok.io/api/webhook/health

# Test webhook manually
curl -X POST https://your-ngrok-url.ngrok.io/api/webhook/paystack/webhook \
  -H "Content-Type: application/json" \
  -H "X-Paystack-Signature: test" \
  -d '{"event":"test","data":{}}'

# Check backend logs
docker logs purwash-backend -f
```

## Support

For issues:
1. Check backend logs for error messages
2. Verify Paystack webhook configuration
3. Test with the provided test scripts
4. Check ngrok dashboard for request logs

## Next Steps

1. Set up ngrok tunnel with setup script
2. Configure Paystack webhook URL
3. Test with webhook test script
4. Monitor logs during testing
5. Deploy to production with HTTPS domain
