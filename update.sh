#!/bin/bash

echo "🧹 Cleaning up and restarting services..."

# Kill all existing Node processes on these ports
echo "Killing existing processes..."
sudo kill -9 $(sudo lsof -t -i:3001) 2>/dev/null || echo "Port 3001 already free"
sudo kill -9 $(sudo lsof -t -i:2424) 2>/dev/null || echo "Port 2424 already free"

# Navigate to project
cd /var/www/mpesaconnect.co.ke

# Stash any local changes and pull
echo "📥 Pulling latest code..."
git stash
git pull origin main

# Backend setup
echo "🔧 Setting up backend..."
cd backend
npm install
nohup npm run dev > /var/log/mpesa-backend.log 2>&1 &
echo "Backend started (PID: $!)"

# Frontend setup
echo "🎨 Setting up frontend..."
cd ../frontend
npm install
nohup npm run dev > /var/log/mpesa-frontend.log 2>&1 &
echo "Frontend started (PID: $!)"

echo ""
echo "✅ Deployment complete!"
echo "Backend logs: tail -f /var/log/mpesa-backend.log"
echo "Frontend logs: tail -f /var/log/mpesa-frontend.log"
echo ""
echo "Services running at:"
echo "  Backend:  http://mpesaconnect.co.ke:3001"
echo "  Frontend: http://mpesaconnect.co.ke:2424"
