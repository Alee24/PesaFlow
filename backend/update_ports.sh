#!/bin/bash

# Configuration
API_PORT=5454
WEB_PORT=5054
DOMAIN="portal.mclinic.co.ke"
API_URL="https://${DOMAIN}/api"
PROJECT_ROOT="/var/www/mpesaconnect.co.ke"

echo "🔄 Starting Configuration Update..."

# 1. Update Backend (API) Configuration
echo "⚙️  Updating Backend (.env)..."
cd $PROJECT_ROOT/backend || exit
# Backup
cp .env .env.bak
# Update PORT
sed -i "s/^PORT=.*/PORT=${API_PORT}/" .env
# If PORT doesn't exist, append it
if ! grep -q "^PORT=" .env; then
  echo "PORT=${API_PORT}" >> .env
fi
echo "✅ Backend set to Port ${API_PORT}"

# 2. Update Frontend (Web) Configuration
echo "⚙️  Updating Frontend (.env)..."
cd $PROJECT_ROOT/frontend || exit
# Backup
cp .env .env.bak
# Update PORT (Frontend usually sets port in start script, but we can try .env)
# Next.js uses PORT env var
if [ -f .env ]; then
    sed -i "s/^PORT=.*/PORT=${WEB_PORT}/" .env
    if ! grep -q "^PORT=" .env; then
        echo "PORT=${WEB_PORT}" >> .env
    fi
    
    # Update API URL
    sed -i "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=${API_URL}|" .env
    if ! grep -q "^NEXT_PUBLIC_API_URL=" .env; then
        echo "NEXT_PUBLIC_API_URL=${API_URL}" >> .env
    fi
else
    echo "PORT=${WEB_PORT}" > .env
    echo "NEXT_PUBLIC_API_URL=${API_URL}" >> .env
fi
echo "✅ Frontend set to Port ${WEB_PORT} and API URL ${API_URL}"

# 3. Rebuild and Restart
echo "🚀 Rebuilding Frontend..."
npm install
npm run build

echo "🔄 Restarting Services with PM2..."
pm2 delete all
# Start API
cd $PROJECT_ROOT/backend
pm2 start dist/main.js --name mclinic-api --env .env

# Start Frontend
cd $PROJECT_ROOT/frontend
pm2 start npm --name mclinic-web -- start -- -p ${WEB_PORT}

echo "💾 Saving PM2 List..."
pm2 save

echo "🎉 Update Complete! Services running on:"
echo "   - API: Port ${API_PORT}"
echo "   - Web: Port ${WEB_PORT}"
