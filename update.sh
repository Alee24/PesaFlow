#!/bin/bash

# ============================================================
# Mpesa Connect - Fresh Pull & Rebuild Script
# Only affects Mpesa Connect. Does NOT touch other apps.
# ============================================================

set -e  # Exit on any error

echo ""
echo "=============================================="
echo "  🚀 Mpesa Connect - Full Rebuild"
echo "=============================================="
echo ""

# 1. Pull latest code from BANKS branch
echo "📥 Pulling latest code from BANKS..."
git fetch origin BANKS
git reset --hard origin/BANKS
echo "✅ Code updated!"
echo ""

# 2. Stop ONLY Mpesa Connect containers (leave others running)
echo "🛑 Stopping Mpesa Connect containers..."
docker-compose stop mpesaconnect-api mpesaconnect-web
echo "✅ Stopped!"
echo ""

# 3. Remove old images to force a truly FRESH build
echo "🗑️  Removing old Mpesa Connect images..."
docker-compose rm -f mpesaconnect-api mpesaconnect-web
docker images | grep mpesaconnect | awk '{print $3}' | xargs docker rmi -f 2>/dev/null || true
echo "✅ Old images cleared!"
echo ""

# 4. Rebuild from scratch and start
echo "🔨 Building fresh images (this takes a few minutes)..."
docker-compose build --no-cache mpesaconnect-api mpesaconnect-web
echo "✅ Build complete!"
echo ""

# 5. Start the rebuilt services
echo "▶️  Starting Mpesa Connect services..."
docker-compose up -d mpesaconnect-api mpesaconnect-web
echo "✅ Services started!"
echo ""

# 6. Wait for API to be ready then run migrations
echo "⏳ Waiting for API to start (20s)..."
sleep 20

echo "🗄️  Running database migrations..."
docker-compose exec mpesaconnect-api npx prisma migrate deploy 2>/dev/null || echo "⚠️  Migration skipped or already up to date"
echo ""

# 7. Show running status
echo "📊 Service Status:"
docker-compose ps mpesaconnect-api mpesaconnect-web
echo ""

echo "=============================================="
echo "  ✅ Mpesa Connect Rebuild Complete!"
echo "  🌐 API  → http://localhost:5454"
echo "  🌐 Web  → http://localhost:5054"
echo "=============================================="
echo ""
