#!/bin/bash

# ==============================================================================
# 🚀 Mpesa Connect: PRODUCTION SYNC & UPDATE
# ==============================================================================
# This script updates Mpesa Connect (Mpesa Connect), fixes dependencies, 
# runs migrations, and restarts services via PM2.
# ==============================================================================

set -e # Exit on error

# --- CONFIGURATION ---
Mpesa Connect_ROOT="/var/www/mpesaconnect.co.ke"

echo "🔄 Initializing Mpesa Connect Update Sequence..."

# 1. UPDATE Mpesa Connect
echo "------------------------------------------------"
echo "🟢 Updating Mpesa Connect (Express/Prisma)..."
cd "$Mpesa Connect_ROOT"
git pull origin BANKS || echo "⚠️  Git pull failed, check branch name."

# Backend
cd "$Mpesa Connect_ROOT/backend"
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push
npm run build
pm2 restart Mpesa Connect-api --update-env || pm2 start dist/server.js --name "Mpesa Connect-api"

# Frontend
cd "$Mpesa Connect_ROOT/frontend"
npm install --legacy-peer-deps
npm run build
pm2 restart Mpesa Connect-web --update-env || pm2 start npm --name "Mpesa Connect-web" -- start -- -p 5054


# 2. VERIFICATION
echo "------------------------------------------------"
echo "💾 Saving PM2 state..."
pm2 save

echo "📊 Final Status:"
pm2 status

echo "🎉 Mpesa Connect UPDATE COMPLETED SUCCESSFULLY!"
