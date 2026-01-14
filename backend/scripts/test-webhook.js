#!/usr/bin/env node

/**
 * Webhook Test Script
 * This script simulates Paystack webhook events for testing
 */

const crypto = require('crypto');

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:5000/api/webhook/paystack/webhook';
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || 'your-paystack-secret-key';

/**
 * Generate Paystack webhook signature
 */
const generateSignature = (payload) => {
  return crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
};

/**
 * Send webhook event
 */
const sendWebhookEvent = async (event) => {
  try {
    const signature = generateSignature(event);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Paystack-Signature': signature
      },
      body: JSON.stringify(event)
    });
    
    const result = await response.text();
    console.log(`✅ Event sent: ${event.event}`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${result}`);
    console.log('');
    
    return response.ok;
  } catch (error) {
    console.error(`❌ Failed to send event: ${event.event}`, error.message);
    return false;
  }
};

/**
 * Test webhook events
 */
const testWebhookEvents = async () => {
  console.log('🧪 Testing PurWash Webhook Events');
  console.log('==================================');
  console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
  console.log('');
  
  // Test 1: Successful charge
  const successChargeEvent = {
    event: 'charge.success',
    data: {
      reference: 'PURWASH_TEST_' + Date.now(),
      amount: 5000, // 50.00 in kobo
      currency: 'GHS',
      customer: {
        email: 'test@example.com',
        customer_code: 'CUS_test123'
      },
      paid_at: new Date().toISOString(),
      channel: 'mobile_money',
      gateway_response: 'Successful',
      metadata: {
        orderId: 'test_order_123',
        custom_fields: []
      }
    }
  };
  
  // Test 2: Failed charge
  const failedChargeEvent = {
    event: 'charge.failed',
    data: {
      reference: 'PURWASH_FAILED_' + Date.now(),
      amount: 3000,
      currency: 'GHS',
      customer: {
        email: 'failed@example.com',
        customer_code: 'CUS_failed123'
      },
      channel: 'mobile_money',
      gateway_response: 'Insufficient funds',
      metadata: {
        orderId: 'failed_order_456'
      }
    }
  };
  
  // Test 3: Successful transfer (payout)
  const successTransferEvent = {
    event: 'transfer.success',
    data: {
      reference: 'TRANSFER_TEST_' + Date.now(),
      amount: 10000, // 100.00 in kobo
      currency: 'GHS',
      recipient: {
        recipient_code: 'RCP_test123',
        name: 'Test Rider',
        description: 'Payout to rider'
      },
      transfer_code: 'TRF_test123',
      transferred_at: new Date().toISOString(),
      metadata: {
        userId: 'test_user_789'
      }
    }
  };
  
  // Test 4: Failed transfer
  const failedTransferEvent = {
    event: 'transfer.failed',
    data: {
      reference: 'TRANSFER_FAILED_' + Date.now(),
      amount: 8000,
      currency: 'GHS',
      recipient: {
        recipient_code: 'RCP_failed123',
        name: 'Failed Rider',
        description: 'Failed payout'
      },
      transfer_code: 'TRF_failed123',
      failure_reason: 'Invalid account number',
      metadata: {
        userId: 'failed_user_999'
      }
    }
  };
  
  // Send test events
  console.log('📤 Sending test webhook events...');
  console.log('');
  
  const events = [
    successChargeEvent,
    failedChargeEvent,
    successTransferEvent,
    failedTransferEvent
  ];
  
  let successCount = 0;
  for (const event of events) {
    const success = await sendWebhookEvent(event);
    if (success) successCount++;
    
    // Small delay between events
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`📊 Test Results: ${successCount}/${events.length} events processed successfully`);
  
  if (successCount === events.length) {
    console.log('🎉 All webhook events processed successfully!');
  } else {
    console.log('⚠️  Some webhook events failed. Check the logs above.');
  }
};

/**
 * Test webhook health
 */
const testWebhookHealth = async () => {
  try {
    console.log('🏥 Testing webhook health endpoint...');
    
    const response = await fetch(`${WEBHOOK_URL.replace('/paystack/webhook', '/health')}`);
    const health = await response.json();
    
    console.log(`✅ Health check status: ${response.status}`);
    console.log('   Response:', JSON.stringify(health, null, 2));
    console.log('');
    
    return response.ok;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
};

/**
 * Main execution
 */
const main = async () => {
  console.log('🔧 PurWash Webhook Test Tool');
  console.log('==============================');
  console.log('');
  
  // Check if webhook URL is provided
  if (!process.env.WEBHOOK_URL && !WEBHOOK_URL.includes('localhost')) {
    console.log('❌ Please set WEBHOOK_URL environment variable');
    console.log('   Example: export WEBHOOK_URL=https://your-ngrok-url.ngrok.io/api/webhook/paystack/webhook');
    process.exit(1);
  }
  
  // Test health endpoint first
  const healthOk = await testWebhookHealth();
  
  if (!healthOk) {
    console.log('❌ Webhook health check failed. Please ensure the server is running.');
    process.exit(1);
  }
  
  // Test webhook events
  await testWebhookEvents();
  
  console.log('');
  console.log('🏁 Webhook testing completed!');
  console.log('');
  console.log('📝 Check your backend logs for detailed processing information.');
  console.log('📊 Check your database for updated orders and user wallets.');
};

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  generateSignature,
  sendWebhookEvent,
  testWebhookEvents,
  testWebhookHealth
};
