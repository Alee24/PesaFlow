#!/bin/bash

# Fresh Deployment Script for Mpesa Connect
# This script completely refreshes the server with latest code
# WARNING: This will DELETE ALL DATA and recreate from scratch

set -e  # Exit on any error

echo "=========================================="
echo "MPESA CONNECT - FRESH DEPLOYMENT SCRIPT"
echo "=========================================="
echo ""
echo "⚠️  WARNING: This will:"
echo "   - Stop all PM2 processes"
echo "   - Delete all existing code"
echo "   - Reset database (DELETE ALL DATA)"
echo "   - Clear all caches"
echo "   - Deploy fresh from GitHub"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "Starting fresh deployment..."
echo ""

# 1. Stop all PM2 processes
echo "📦 Stopping PM2 processes..."
pm2 stop all || true
pm2 delete all || true
pm2 save --force

# 2. Navigate to project directory and backup .env files
echo "💾 Backing up environment files..."
cd /var/www/mpesaconnect.co.ke
cp backend/.env /tmp/backend.env.backup || true
cp frontend/.env.local /tmp/frontend.env.backup || true

# 3. Delete existing code
echo "🗑️  Deleting existing code..."
cd /var/www
rm -rf mpesaconnect.co.ke

# 4. Clone fresh from GitHub
echo "📥 Cloning fresh code from GitHub..."
git clone https://github.com/Alee24/PesaFlow.git mpesaconnect.co.ke
cd mpesaconnect.co.ke

# 5. Restore environment files
echo "🔧 Restoring environment files..."
cp /tmp/backend.env.backup backend/.env || true
cp /tmp/frontend.env.backup frontend/.env.local || true

# 6. Backend Setup
echo ""
echo "🔨 Setting up Backend..."
cd backend

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

# Generate Prisma Client
echo "🔄 Generating Prisma Client..."
npx prisma generate

# Reset Database (WARNING: Deletes all data)
echo "🗄️  Resetting database..."
npx prisma db push --force-reset --accept-data-loss

# Create default admin account
echo "👤 Creating default admin account..."
cat > /tmp/create-admin.ts << 'EOF'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        // Delete existing admin if exists
        await prisma.user.deleteMany({
            where: { email: 'mettoalex@gmail.com' }
        });

        // Create admin user
        const hashedPassword = await bcrypt.hash('Digital2025', 10);
        const admin = await prisma.user.create({
            data: {
                email: 'mettoalex@gmail.com',
                name: 'Admin',
                phoneNumber: '+254700000000',
                passwordHash: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                emailVerified: true
            }
        });

        console.log('✅ Admin account created:', admin.email);
        console.log('📧 Email: mettoalex@gmail.com');
        console.log('🔑 Password: Digital2025');

    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
EOF

npx ts-node /tmp/create-admin.ts
rm /tmp/create-admin.ts

# Build backend
echo "🏗️  Building backend..."
npm run build

# 7. Frontend Setup
echo ""
echo "🎨 Setting up Frontend..."
cd ../frontend

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# 8. Clear PM2 cache and logs
echo ""
echo "🧹 Clearing PM2 cache and logs..."
pm2 flush
rm -rf ~/.pm2/logs/*

# 9. Start services
echo ""
echo "🚀 Starting services..."
cd /var/www/mpesaconnect.co.ke/backend
pm2 start dist/server.js --name pesaflow-backend
pm2 save

cd /var/www/mpesaconnect.co.ke/frontend
pm2 start npm --name pesaflow-frontend -- start
pm2 save

# 10. Wait for services to start
echo ""
echo "⏳ Waiting for services to start..."
sleep 5

# 11. Check status
echo ""
echo "📊 Service Status:"
pm2 list

echo ""
echo "=========================================="
echo "✅ FRESH DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "📧 Admin Login:"
echo "   Email: mettoalex@gmail.com"
echo "   Password: Digital2025"
echo ""
echo "🌐 Access your application at:"
echo "   https://mpesaconnect.co.ke"
echo ""
echo "📝 Check logs with:"
echo "   pm2 logs pesaflow-backend"
echo "   pm2 logs pesaflow-frontend"
echo ""
