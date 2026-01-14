#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Configuration
API_PORT=5454
WEB_PORT=5054
APP_NAME="pesaflow"
PROJECT_ROOT="/var/www/mpesaconnect.co.ke"

echo "🚀 Starting Deployment for ${APP_NAME}..."
echo "================================================"

# Function to check if command succeeded
check_success() {
    if [ $? -eq 0 ]; then
        echo "✅ $1"
    else
        echo "❌ $1 failed"
        exit 1
    fi
}

# 1. Build Backend
echo ""
echo "📦 Building Backend..."
echo "------------------------------------------------"
cd "$PROJECT_ROOT/backend" || { echo "❌ Backend directory not found at $PROJECT_ROOT/backend"; exit 1; }

echo "  → Installing dependencies..."
npm install
check_success "Backend npm install"

echo "  → Generating Prisma client..."
npx prisma generate
check_success "Prisma generate"

echo "  → Compiling TypeScript..."
npm run build
check_success "Backend build"

# Verify build output
if [ ! -f "dist/main.js" ]; then
    echo "❌ CRITICAL: dist/main.js not found after build!"
    echo "   Build may have failed silently. Check build logs above."
    exit 1
fi
echo "✅ Backend built successfully (dist/main.js verified)"

# Update .env for backend
echo "  → Updating backend .env..."
sed -i "s/^PORT=.*/PORT=${API_PORT}/" .env 2>/dev/null || echo "PORT=${API_PORT}" >> .env
check_success "Backend .env updated"

# 2. Build Frontend
echo ""
echo "📦 Building Frontend..."
echo "------------------------------------------------"
cd "$PROJECT_ROOT/frontend" || { echo "❌ Frontend directory not found at $PROJECT_ROOT/frontend"; exit 1; }

# Update .env for frontend
echo "  → Updating frontend .env..."
if [ -f .env ]; then
    sed -i "s/^PORT=.*/PORT=${WEB_PORT}/" .env
    sed -i "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://mpesaconnect.co.ke/api|" .env
else
    echo "PORT=${WEB_PORT}" > .env
    echo "NEXT_PUBLIC_API_URL=https://mpesaconnect.co.ke/api" >> .env
fi
check_success "Frontend .env updated"

echo "  → Installing dependencies..."
npm install
check_success "Frontend npm install"

echo "  → Building Next.js..."
npm run build
check_success "Frontend build"

# 3. Stop existing services
echo ""
echo "🔄 Managing PM2 Services..."
echo "------------------------------------------------"
echo "  → Stopping existing services..."
pm2 delete ${APP_NAME}-api 2>/dev/null || echo "  (No existing ${APP_NAME}-api process)"
pm2 delete ${APP_NAME}-web 2>/dev/null || echo "  (No existing ${APP_NAME}-web process)"

# Clean up old mclinic processes if they exist
pm2 delete mclinic-api 2>/dev/null || true
pm2 delete mclinic-web 2>/dev/null || true

# 4. Start Backend API
echo ""
echo "  → Starting Backend API..."
cd "$PROJECT_ROOT/backend"
pm2 start dist/main.js --name "${APP_NAME}-api"
check_success "Backend API started"

# Wait a moment and check if it's still running
sleep 2
if pm2 describe "${APP_NAME}-api" | grep -q "online"; then
    echo "✅ Backend API is running"
else
    echo "❌ Backend API failed to start. Checking logs..."
    pm2 logs "${APP_NAME}-api" --lines 30 --nostream
    exit 1
fi

# 5. Start Frontend
echo ""
echo "  → Starting Frontend..."
cd "$PROJECT_ROOT/frontend"
pm2 start npm --name "${APP_NAME}-web" -- start -- -p ${WEB_PORT}
check_success "Frontend started"

# 6. Save PM2 configuration
echo ""
echo "  → Saving PM2 configuration..."
pm2 save
check_success "PM2 configuration saved"

# 7. Display status
echo ""
echo "📊 Service Status:"
echo "------------------------------------------------"
pm2 status

# 8. Verify ports are listening
echo ""
echo "🔌 Verifying Ports..."
echo "------------------------------------------------"
sleep 2
if netstat -tulpn 2>/dev/null | grep -q ":${API_PORT}"; then
    echo "✅ API listening on port ${API_PORT}"
else
    echo "⚠️  WARNING: Port ${API_PORT} not detected (may take a moment to start)"
fi

if netstat -tulpn 2>/dev/null | grep -q ":${WEB_PORT}"; then
    echo "✅ Frontend listening on port ${WEB_PORT}"
else
    echo "⚠️  WARNING: Port ${WEB_PORT} not detected (may take a moment to start)"
fi

# 9. Final summary
echo ""
echo "================================================"
echo "🎉 Deployment Complete!"
echo "================================================"
echo ""
echo "Services:"
echo "  • API (${APP_NAME}-api): Port ${API_PORT}"
echo "  • Web (${APP_NAME}-web): Port ${WEB_PORT}"
echo ""
echo "Next steps:"
echo "  1. Check logs: pm2 logs ${APP_NAME}-api"
echo "  2. Monitor status: pm2 monit"
echo "  3. Test API: curl http://localhost:${API_PORT}/api/health"
echo "  4. Visit: https://mpesaconnect.co.ke"
echo ""
