# 🚀 Quick Webhook Setup Guide

## 1. Start Ngrok Tunnel
```bash
cd backend
./scripts/setup-webhook.sh
```

## 2. Configure Paystack
- Copy the webhook URL from the script output
- Go to https://dashboard.paystack.co/
- Settings → Webhooks → Add webhook URL
- Select events: `charge.success`, `charge.failed`, `transfer.success`, `transfer.failed`, `transfer.reversed`

## 3. Test Webhook
```bash
cd backend
./scripts/test-webhook.js
```

## 4. Manual Test
```bash
# Health check
curl http://localhost:5000/api/webhook/health

# Test endpoint  
curl http://localhost:5000/api/webhook/test
```

## 🎯 That's it! Your webhook is ready for testing.

For detailed instructions, see: [WEBHOOK_SETUP.md](./WEBHOOK_SETUP.md)
