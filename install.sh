#!/bin/bash

# Mpesa Connect - One-Command VPS Installer
# Usage: ./install.sh

echo "🚀 Starting Mpesa Connect Installation..."

# 1. Update Codebase
echo "⬇️  Pulling latest code..."
git reset --hard origin/main
git pull origin main

# Check for Frontend Config
if [ ! -f frontend/.env ]; then
    echo "❌ frontend/.env file not found!"
    echo "❗ You MUST create frontend/.env with NEXT_PUBLIC_API_URL before installing."
    echo "👉 Run: nano frontend/.env"
    echo "   Add: NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:3001/api"
    exit 1
fi

# 2. Setup Backend
echo "🛠️  Setting up Backend..."
cd backend

if [ ! -f .env ]; then
    echo "⚠️  .env file not found in backend! Copying .env.example..."
    cp .env.example .env
    echo "❗ Please edit backend/.env with your database credentials before continuing."
    read -p "Press Enter once you have configured .env..."
fi

# Create uploads directory explicitly
echo "📂 Creating uploads directory..."
mkdir -p public/uploads
chmod 777 public/uploads

echo "📦 Installing Backend Dependencies..."
npm install

echo "🏗️  Building Backend..."
npm run build

echo "🗄️  Setting up Database..."
npx prisma generate
npx prisma db push

echo "🌱 Seeding Database (Admin User)..."
npx ts-node seed-users.ts

echo "🔄 Starting Backend with PM2..."
pm2 delete mpesa-backend 2>/dev/null || true
pm2 start dist/server.js --name mpesa-backend

cd ..

# 3. Setup Frontend
echo "🎨 Setting up Frontend..."
cd frontend

echo "📦 Installing Frontend Dependencies..."
npm install

echo "🏗️  Building Frontend..."
npm run build

echo "🔄 Starting Frontend with PM2..."
pm2 delete mpesa-frontend 2>/dev/null || true
pm2 start npm --name mpesa-frontend -- start -- -p 2424

# 4. Finalize
echo "💾 Saving PM2 Process List..."
pm2 save

echo "🎉 Installation Complete!"
echo "👉 Backend running on port 3001"
echo "👉 Frontend running on port 2424"
