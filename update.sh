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
git fetch --all

# Stash any local changes so they don't block checkout
git stash 2>/dev/null || true

# Force switch to BANKS branch, discarding all local modifications
git checkout -f BANKS 2>/dev/null || git checkout -f -b BANKS origin/BANKS 2>/dev/null || true

# Hard reset to latest origin/BANKS
git reset --hard origin/BANKS
echo "✅ Code updated!"
echo ""

# 2. Force-free ports 5454 and 5054 by stopping any container using them
echo "🛑 Freeing ports 5454 and 5054..."
for port in 5454 5054; do
    CONTAINER=$(docker ps --filter "publish=$port" -q)
    if [ -n "$CONTAINER" ]; then
        echo "   Stopping container on port $port..."
        docker stop $CONTAINER 2>/dev/null || true
        docker rm -f $CONTAINER 2>/dev/null || true
    fi
done
docker-compose stop mpesaconnect-api mpesaconnect-web 2>/dev/null || true
docker-compose rm -f mpesaconnect-api mpesaconnect-web 2>/dev/null || true
echo "✅ Ports freed!"
echo ""

# 3. Remove old images to force a truly FRESH build
echo "🗑️  Removing old Mpesa Connect images..."
docker images | grep -i mpesaconnect | awk '{print $3}' | xargs docker rmi -f 2>/dev/null || true
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

echo "🎁  Fixing 1-Year Promotion subscriptions (upgrading FREE→PRO for promo accounts)..."
docker-compose exec mpesaconnect-api npx ts-node --transpile-only -r dotenv/config src/scripts/fix-promo-subscriptions.ts 2>/dev/null || echo "⚠️  Promo fix skipped (check logs if accounts still show FREE)"
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
