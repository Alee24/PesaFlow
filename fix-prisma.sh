#!/bin/bash

echo "=========================================="
echo "   Fixing CRM Prisma Client Issue"
echo "=========================================="

cd /var/www/mpesaconnect.co.ke/backend

echo "📦 Regenerating Prisma Client..."
npx prisma generate

echo ""
echo "🗄️  Running database migration..."
npx prisma migrate deploy

echo ""
echo "✅ Prisma client regenerated!"
echo ""
echo "Now run: pm2 restart all"
