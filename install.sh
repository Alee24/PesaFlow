#!/bin/bash
set -e

# Mpesa Connect / PesaFlow - Installer & Setup Script
# Usage: ./install.sh

echo "🚀 Starting PesaFlow Installation..."

# 0. Permissions
echo "🔑 Making shell scripts executable..."
find . -name "*.sh" -exec chmod +x {} \;

# 1. Update Codebase
echo "⬇️  Pulling latest code..."
git pull origin main

# Check for Frontend Config
if [ ! -f frontend/.env ]; then
    echo "⚠️  frontend/.env file not found!"
    echo "👉 Creating frontend/.env from example (if available) or creating new..."
    if [ -f frontend/.env.example ]; then
        cp frontend/.env.example frontend/.env
    fi
    echo "❗ You MUST ensure frontend/.env has NEXT_PUBLIC_API_URL set."
fi

# 2. Setup Backend
echo "🛠️  Setting up Backend..."
cd backend

if [ ! -f .env ]; then
    echo "⚠️  .env file not found in backend!"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Copied .env.example to .env"
    fi
    echo "❗ Please edit backend/.env with your database credentials."
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

echo "🌱 Seeding Database (Default Users)..."
npx ts-node prisma/seed.ts

echo "🔄 Starting Backend with PM2..."
pm2 delete pesaflow-backend 2>/dev/null || true
pm2 start dist/app.js --name pesaflow-backend || pm2 start dist/server.js --name pesaflow-backend

cd ..

# 3. Setup Frontend
echo "🎨 Setting up Frontend..."
cd frontend

echo "📦 Installing Frontend Dependencies..."
npm install

echo "🏗️  Building Frontend..."
# Check for legacy peer deps issue if needed, but standard install usually works
npm run build

echo "🔄 Starting Frontend with PM2..."
pm2 delete pesaflow-frontend 2>/dev/null || true
pm2 start npm --name pesaflow-frontend -- start -- -p 3000

# 4. Finalize
echo "💾 Saving PM2 Process List..."
pm2 save

echo "🎉 Installation Complete!"
echo "👉 Backend running (pesaflow-backend)"
echo "👉 Frontend running (pesaflow-frontend)"
