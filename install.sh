#!/bin/bash

# PesaFlow - One-Command VPS Installer
# Usage: ./install.sh

echo "🚀 Starting PesaFlow Installation..."

# 1. Update Codebase
echo "⬇️  Pulling latest code..."
git reset --hard origin/main
git pull origin main

# 2. Setup Backend
echo "🛠️  Setting up Backend..."
cd backend

if [ ! -f .env ]; then
    echo "⚠️  .env file not found in backend! Copying .env.example..."
    cp .env.example .env
    echo "❗ Please edit backend/.env with your database credentials before continuing."
    read -p "Press Enter once you have configured .env..."
fi

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
pm2 delete pesaflow-backend 2>/dev/null || true
pm2 start dist/server.js --name pesaflow-backend

cd ..

# 3. Setup Frontend
echo "🎨 Setting up Frontend..."
cd frontend

echo "📦 Installing Frontend Dependencies..."
npm install

echo "🏗️  Building Frontend..."
npm run build

echo "🔄 Starting Frontend with PM2..."
pm2 delete pesaflow-frontend 2>/dev/null || true
pm2 start npm --name pesaflow-frontend -- start -- -p 2424

# 4. Finalize
echo "💾 Saving PM2 Process List..."
pm2 save

echo "🎉 Installation Complete!"
echo "👉 Backend running on port 3001"
echo "👉 Frontend running on port 2424"
