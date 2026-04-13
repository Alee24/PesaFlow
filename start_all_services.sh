#!/bin/bash

# 🚀 Mpesa Connect: PRODUCTION LAUNCH SCRIPT
# ==============================================================================
# This script configures and launches Mpesa Connect (Mpesa Connect).
# - Mpesa Connect: Port 5454 (API), 5054 (Web)
# ==============================================================================

set -e # Exit on error

# --- CONFIGURATION ---
Mpesa Connect_ROOT="/var/www/mpesaconnect.co.ke"

# Mpesa Connect Ports
PF_API_PORT=5454
PF_WEB_PORT=5054

echo "🔄 Initializing Mpesa Connect Launch Sequence..."

# 0. DATABASE PREPARATION (Ensure they exist)
echo "🗄️  Ensuring MySQL database exists..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS Mpesa Connect_v2;" 2>/dev/null || echo "⚠️  Could not create Mpesa Connect_v2 (Check permissions)"

# 1. CLEANUP (Stop everything first to avoid port locks)
echo "🛑 Stopping Mpesa Connect services..."
pm2 delete Mpesa Connect-api 2>/dev/null || true
pm2 delete Mpesa Connect-web 2>/dev/null || true


# ==============================================================================
# 🚀 START Mpesa Connect
# ==============================================================================
echo "------------------------------------------------"
echo "🟢 Starting Mpesa Connect (API: $PF_API_PORT, Web: $PF_WEB_PORT)..."

# API
cd "$Mpesa Connect_ROOT/backend"
# Ensure .env has correct port
sed -i "s/^PORT=.*/PORT=${PF_API_PORT}/" .env 2>/dev/null || echo "PORT=${PF_API_PORT}" >> .env
pm2 start dist/server.js --name "Mpesa Connect-api" --update-env

# Web
cd "$Mpesa Connect_ROOT/frontend"
pm2 start npm --name "Mpesa Connect-web" -- start -- -p ${PF_WEB_PORT}


# ==============================================================================
# ✅ FINAL VERIFICATION
# ==============================================================================
echo "------------------------------------------------"
echo "💾 Saving PM2 Process List..."
pm2 save

echo "------------------------------------------------"
echo "📊 Current Status:"
pm2 status

echo ""
echo "🎉 Mpesa Connect IS GO!"
echo "   -> Mpesa Connect API: http://localhost:$PF_API_PORT"
echo "   -> Mpesa Connect Web: http://localhost:$PF_WEB_PORT"
echo ""
echo "⚠️  IMPORTANT: Ensure your Apache config for mpesaconnect.co.ke proxies to these ports!"
