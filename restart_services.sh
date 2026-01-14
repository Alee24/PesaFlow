#!/bin/bash

# Exit regarding any error
set -e

echo "🛑 Stopping and Deleting ALL existing PM2 processes..."
# Delete expected process names
pm2 delete mclinic-api 2>/dev/null || true
pm2 delete mclinic-web 2>/dev/null || true
pm2 delete pesaflow-api 2>/dev/null || true
pm2 delete pesaflow-web 2>/dev/null || true

# Optional: Kill any lingering processes on ports 5454, 5054, 3000, 3001 to be safe
# (Uncomment if you want to force kill ports)
# fuser -k 5454/tcp 2>/dev/null || true
# fuser -k 5054/tcp 2>/dev/null || true

echo "------------------------------------------------"
echo "♻️  Starting PESAFLOW Service..."
echo "------------------------------------------------"

# Start PesaFlow API
cd /var/www/mpesaconnect.co.ke/backend
echo "  → Starting PesaFlow API..."
pm2 start dist/server.js --name "pesaflow-api" --update-env

# Start PesaFlow Web
cd /var/www/mpesaconnect.co.ke/frontend
echo "  → Starting PesaFlow Web..."
pm2 start npm --name "pesaflow-web" -- start -- -p 5054


echo "------------------------------------------------"
echo "♻️  Starting M-CLINIC Service..."
echo "------------------------------------------------"

# Start M-Clinic API
# Note: You need to specify a DIFFERENT PORT for M-Clinic if PesaFlow is using 5454
# Assuming M-Clinic uses default 3000/3001 or you have configured it differently.
# If they share the same port configured in code, ONLY ONE WILL WORK.

cd /var/www/mclinicportal/backend
echo "  → Starting M-Clinic API..."
# Check if main.js or server.js exists, adjusting standard NestJS build output
if [ -f "dist/main.js" ]; then
    pm2 start dist/main.js --name "mclinic-api" --update-env
else 
    echo "⚠️  Could not find M-Clinic API build (dist/main.js). Skipping..."
fi

# Start M-Clinic Web
cd /var/www/mclinicportal
echo "  → Starting M-Clinic Web..."
# Assuming M-Clinic runs on a different port, e.g., 3000. 
# If it also tries to force 5054, it will crash.
pm2 start npm --name "mclinic-web" -- start -- -p 3000


echo "------------------------------------------------"
echo "💾 Saving PM2 Configuration..."
echo "------------------------------------------------"
pm2 save

echo ""
echo "✅ All clean. Current Status:"
pm2 status
