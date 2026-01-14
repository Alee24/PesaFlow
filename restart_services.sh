#!/bin/bash

# Exit regarding any error
set -e

echo "🛑 Stopping ALL existing PM2 processes..."
pm2 delete mclinic-api 2>/dev/null || true
pm2 delete mclinic-web 2>/dev/null || true
pm2 delete pesaflow-api 2>/dev/null || true
pm2 delete pesaflow-web 2>/dev/null || true

echo "------------------------------------------------"
echo "♻️  Starting PESAFLOW Service (5454 / 5054)..."
echo "------------------------------------------------"

# Start PesaFlow API (Port 5454)
cd /var/www/mpesaconnect.co.ke/backend
# Ensure .env has correct port
sed -i "s/^PORT=.*/PORT=5454/" .env 2>/dev/null || echo "PORT=5454" >> .env
echo "  → Starting PesaFlow API..."
pm2 start dist/server.js --name "pesaflow-api" --update-env

# Start PesaFlow Web (Port 5054)
cd /var/www/mpesaconnect.co.ke/frontend
# Ensure .env has correct port
sed -i "s/^PORT=.*/PORT=5054/" .env 2>/dev/null || echo "PORT=5054" >> .env
echo "  → Starting PesaFlow Web..."
pm2 start npm --name "pesaflow-web" -- start -- -p 5054

echo "------------------------------------------------"
echo "♻️  Starting M-CLINIC Service (3434 / 3034)..."
echo "------------------------------------------------"

# Start M-Clinic API (Port 3434)
cd /var/www/mclinicportal/backend
echo "  → Starting M-Clinic API..."
# We pass PORT=3434 explicitly to env
PORT=3434 pm2 start dist/main.js --name "mclinic-api" --update-env

# Start M-Clinic Web (Port 3034)
cd /var/www/mclinicportal
echo "  → Starting M-Clinic Web..."
pm2 start npm --name "mclinic-web" -- start -- -p 3034

echo "------------------------------------------------"
echo "💾 Saving PM2 Configuration..."
echo "------------------------------------------------"
pm2 save

echo ""
echo "✅ All clean. Current Status:"
pm2 status
