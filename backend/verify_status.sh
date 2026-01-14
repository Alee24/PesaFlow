#!/bin/bash

echo "🚀 RESTARTING MpesaConnect Services..."
# RESTART EVERYTHING
pm2 restart pesaflow-api pesaflow-web

# WAIT FOR STARTUP (10s)
echo "----------------------------------------"
echo "⏳ Waiting 10s for services to boot..."
sleep 10
echo "----------------------------------------"

# 1. CHECK PROCESS STATUS
echo "📊 PM2 Status:"
pm2 list
echo "----------------------------------------"

# 2. VERIFY API RESPONSE (Port 5454)
echo "🔍 Testing API (internal port 5454)..."
if curl -s -I http://localhost:5454/api/health > /dev/null; then
    echo "✅ API is UP and responding (Health Check Passed)!"
elif curl -s -I http://localhost:5454/ > /dev/null; then
    echo "✅ API is UP and responding (Root Route)!"
else
    echo "❌ API is NOT responding on port 5454."
    echo "   Checking logs..."
    pm2 logs pesaflow-api --lines 20 --nostream
fi

# 3. VERIFY WEB RESPONSE (Port 5054)
echo "----------------------------------------"
echo "🔍 Testing Web App (internal port 5054)..."
if curl -s -I http://localhost:5054/ > /dev/null; then
    echo "✅ Web App is UP and responding!"
else
    echo "❌ Web App is NOT responding on port 5054."
    echo "   Checking logs..."
    pm2 logs pesaflow-web --lines 20 --nostream
fi
echo "----------------------------------------"
