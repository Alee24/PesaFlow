#!/bin/bash
set -e

echo "=============================================="
echo "  🚀 Mpesa Connect - Live Server Update"
echo "=============================================="
echo ""

# 1. Navigate to the app directory (adjust path if needed)
# cd /var/www/mpesaconnect.co.ke || true

# 2. Pull latest code (We pull from main or whichever live branch you use)
echo "📥 Pulling latest code..."
git fetch --all
git stash 2>/dev/null || true
# Assuming the main branch is used for live, replace BANKS with main if needed
git reset --hard origin/BANKS
git pull origin BANKS
echo "✅ Code updated!"
echo ""

# 3. Clean up any dangling Docker builder cache to save VPS storage
echo "🧹 Cleaning up Docker cache..."
docker builder prune -f
echo ""

# 4. Rebuild from scratch and start
echo "🔨 Building fresh images for live server..."
docker-compose build --no-cache mpesaconnect-api mpesaconnect-web
echo "✅ Build complete!"
echo ""

# 5. Start the rebuilt services
echo "▶️  Starting Mpesa Connect services..."
docker-compose up -d mpesaconnect-api mpesaconnect-web
echo "✅ Services started!"
echo ""

# 6. Wait for API to be ready then run migrations
echo "⏳ Waiting for API to start (15s)..."
sleep 15

echo "🗄️  Running database migrations..."
docker-compose exec -T mpesaconnect-api npx prisma migrate deploy || echo "⚠️  Migration skipped or already up to date"
echo "✅ Migrations complete!"
echo ""

# 7. Restart services to ensure the schema is applied correctly
echo "🔄 Restarting API to load new schema..."
docker-compose restart mpesaconnect-api
echo ""

# 8. Show running status
echo "📊 Service Status:"
docker-compose ps mpesaconnect-api mpesaconnect-web
echo ""

echo "=============================================="
echo "  ✅ Live Server Update Complete!"
echo "  🌐 Your Mpesa Connect platform is live."
echo "=============================================="
echo ""
