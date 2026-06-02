#!/bin/bash

echo "🚀 Mpesa Connect Starting Docker Deployment..."

# Ensure we are in the correct directory
cd /var/www/mpesaconnect.co.ke || exit

# 1. Stop any conflicting PM2 processes
echo "🛑 Stopping PM2 services to avoid port conflicts..."
pm2 delete pesaflow-api 2>/dev/null || true
pm2 delete pesaflow-web 2>/dev/null || true
pm2 delete pesaflow-backend 2>/dev/null || true
pm2 delete pesaflow-frontend 2>/dev/null || true
pm2 save

# 2. Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# 3. Check and create environment files
echo "🔧 Checking environment files..."
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend .env from example..."
    cp server-config/backend.env.example backend/.env
    # Ensure PORT matches Apache proxy configuration
    sed -i "s/^PORT=.*/PORT=2365/" backend/.env 2>/dev/null || echo "PORT=2365" >> backend/.env
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "📝 Creating frontend .env.local from example..."
    cp server-config/frontend.env.example frontend/.env.local
fi

# 4. Build and start Docker containers
echo "🐳 Building and starting Docker containers..."
# We pass NEXT_PUBLIC_API_URL so the frontend Dockerfile can bake it into the Next.js bundle
docker-compose build --build-arg NEXT_PUBLIC_API_URL=https://mpesaconnect.co.ke/api
docker-compose up -d

echo "✅ Mpesa Connect Docker Deployment Complete!"
echo "🌐 Backend is running on port 2365 (mapped by Apache)"
echo "🌐 Frontend is running on port 3652 (mapped by Apache)"
