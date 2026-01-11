#!/bin/bash

# Deployment Script for Mpesa Connect
# This script deploys the latest code and configurations to the server

echo "=========================================="
echo "MPESA CONNECT - DEPLOYMENT SCRIPT"
echo "=========================================="
echo ""

# 1. Update code from GitHub
echo "📥 Pulling latest code from GitHub..."
cd /var/www/mpesaconnect.co.ke
git pull origin main

# 2. Backend deployment
echo ""
echo "🔨 Deploying Backend..."
cd backend

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run database migrations (if any)
npx prisma db push

# Build backend
npm run build

# 3. Frontend deployment
echo ""
echo "🎨 Deploying Frontend..."
cd ../frontend

# Install dependencies
npm install

# Build frontend
npm run build

# 4. Create/Update environment files
echo ""
echo "🔧 Checking environment files..."

# Check if backend .env exists
if [ ! -f "/var/www/mpesaconnect.co.ke/backend/.env" ]; then
    echo "⚠️  Backend .env not found! Please create it manually."
fi

# Check if frontend .env.local exists
if [ ! -f "/var/www/mpesaconnect.co.ke/frontend/.env.local" ]; then
    echo "📝 Creating frontend .env.local..."
    cat > /var/www/mpesaconnect.co.ke/frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://mpesaconnect.co.ke/api
EOF
fi

# 5. Restart services
echo ""
echo "🔄 Restarting services..."
pm2 restart all

# Wait for services to start
sleep 3

# 6. Check status
echo ""
echo "📊 Service Status:"
pm2 list

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "🌐 Access your application at:"
echo "   https://mpesaconnect.co.ke"
echo ""
echo "📝 Check logs with:"
echo "   pm2 logs pesaflow-backend"
echo "   pm2 logs pesaflow-frontend"
echo ""
