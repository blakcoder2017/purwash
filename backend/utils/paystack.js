const axios = require('axios');

const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

// #region agent log
fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'debug-session',
    runId: 'pre-fix',
    hypothesisId: 'H1',
    location: 'backend/utils/paystack.js:12',
    message: 'paystack_client_initialized',
    data: {
      hasSecretKey: Boolean(process.env.PAYSTACK_SECRET_KEY),
      keyType: process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_live_')
        ? 'live'
        : process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_test_')
          ? 'test'
          : 'unknown'
    },
    timestamp: Date.now()
  })
}).catch(() => {});
// #endregion

module.exports = paystack;