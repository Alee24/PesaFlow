#!/bin/bash

echo "🚀 Starting deployment update..."

# Navigate to project root
cd /var/www/mpesaconnect.co.ke

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
cd frontend
npm install
cd ../backend
npm install

# Kill existing processes
echo "🔪 Stopping existing processes..."
sudo kill -9 $(sudo lsof -t -i:3001) 2>/dev/null || true
sudo kill -9 $(sudo lsof -t -i:2424) 2>/dev/null || true

# Start backend
echo "🔧 Starting backend..."
cd /var/www/mpesaconnect.co.ke/backend
npm run dev &

# Start frontend  
echo "🎨 Starting frontend..."
cd /var/www/mpesaconnect.co.ke/frontend
npm run dev &

echo "✅ Deployment complete!"
echo "Backend: http://mpesaconnect.co.ke:3001"
echo "Frontend: http://mpesaconnect.co.ke:2424"
