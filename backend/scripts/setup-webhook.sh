#!/bin/bash

# PurWash Webhook Setup Script with Ngrok
# This script sets up ngrok for local webhook testing

echo "🚀 Setting up PurWash Webhook with Ngrok..."
echo "=========================================="

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ Ngrok is not installed. Please install it first:"
    echo "   macOS: brew install ngrok"
    echo "   Or download from: https://ngrok.com/download"
    exit 1
fi

# Check if server is running on port 5000
if ! curl -s http://localhost:5000/api/webhook/health > /dev/null; then
    echo "❌ Backend server is not running on port 5000"
    echo "   Please start the server first: npm run start:dev"
    exit 1
fi

echo "✅ Backend server is running"
echo "✅ Ngrok is installed"

# Start ngrok tunnel
echo ""
echo "🔧 Starting ngrok tunnel for port 5000..."
echo "   This will expose your local server to the internet"
echo ""

# Kill any existing ngrok processes on port 5000
pkill -f "ngrok http 5000" 2>/dev/null || true

# Start ngrok in background
ngrok http 5000 --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
echo "⏳ Waiting for ngrok to start..."
sleep 5

# Get the public URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | cut -d'"' -f4 | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL"
    kill $NGROK_PID
    exit 1
fi

echo "✅ Ngrok tunnel established!"
echo ""
echo "🌐 Ngrok Public URL: $NGROK_URL"
echo ""
echo "📡 Webhook Endpoints:"
echo "   Paystack Webhook: $NGROK_URL/api/webhook/paystack/webhook"
echo "   Test Endpoint:    $NGROK_URL/api/webhook/test"
echo "   Health Check:     $NGROK_URL/api/webhook/health"
echo ""

# Construct the full webhook URL
WEBHOOK_URL="$NGROK_URL/api/webhook/paystack/webhook"

echo "🔧 Paystack Webhook Configuration:"
echo "   Webhook URL: $WEBHOOK_URL"
echo ""
echo "📋 Next Steps:"
echo "   1. Copy the webhook URL above"
echo "   2. Go to your Paystack Dashboard: https://dashboard.paystack.co/"
echo "   3. Navigate to Settings → Webhooks"
echo "   4. Add the webhook URL"
echo "   5. Select the events you want to listen for:"
echo "      - charge.success"
echo "      - charge.failed"
echo "      - transfer.success"
echo "      - transfer.failed"
echo "      - transfer.reversed"
echo ""
echo "🧪 Testing the Webhook:"
echo "   Test the webhook endpoint:"
echo "   curl $NGROK_URL/api/webhook/test"
echo ""
echo "   Check webhook health:"
echo "   curl $NGROK_URL/api/webhook/health"
echo ""
echo "📝 Ngrok Dashboard:"
echo "   http://localhost:4040"
echo ""
echo "⚠️  Important:"
echo "   - Keep this terminal open to maintain the tunnel"
echo "   - The ngrok URL changes each time you restart"
echo "   - For production, use a real domain with HTTPS"
echo ""
echo "🔄 To stop the webhook tunnel:"
echo "   Press Ctrl+C or run: pkill -f ngrok"
echo ""

# Keep the script running to maintain the tunnel
echo "🔄 Webhook tunnel is active. Press Ctrl+C to stop..."
trap "echo '🛑 Stopping webhook tunnel...'; kill $NGROK_PID; exit" INT

# Monitor ngrok logs
tail -f /tmp/ngrok.log &

# Wait for interrupt
wait
