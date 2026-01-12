#!/bin/bash

# Configuration
API_PORT=5454
WEB_PORT=5054
APP_NAME="pesaflow"
PROJECT_ROOT="/var/www/mpesaconnect.co.ke"

echo "🚀 Starting Fresh Deployment for ${APP_NAME}..."

# 1. Build Backend
echo "⚙️  Building Backend..."
cd $PROJECT_ROOT/backend || exit
# Ensure Port is set
sed -i "s/^PORT=.*/PORT=${API_PORT}/" .env
if ! grep -q "^PORT=" .env; then echo "PORT=${API_PORT}" >> .env; fi

# Install and Build
npm install
npx prisma generate
npm run build

# 2. Build Frontend
echo "⚙️  Building Frontend..."
cd $PROJECT_ROOT/frontend || exit
# Ensure Port is set
sed -i "s/^PORT=.*/PORT=${WEB_PORT}/" .env
if ! grep -q "^PORT=" .env; then echo "PORT=${WEB_PORT}" >> .env; fi

# Update API URL to correct value
sed -i "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://portal.mclinic.co.ke/api|" .env
if ! grep -q "^NEXT_PUBLIC_API_URL=" .env; then echo "NEXT_PUBLIC_API_URL=https://portal.mclinic.co.ke/api" >> .env; fi

# Install and Build
npm install
npm run build

# 3. Start Processes with Unique Names
echo "🔄 Starting Services..."
# Delete old conflicting names if they exist
pm2 delete mclinic-api 2>/dev/null
pm2 delete mclinic-web 2>/dev/null
# Delete new names to restart fresh
pm2 delete "${APP_NAME}-api" 2>/dev/null
pm2 delete "${APP_NAME}-web" 2>/dev/null

# Start API
cd $PROJECT_ROOT/backend
pm2 start dist/main.js --name "${APP_NAME}-api" --env .env

# Start Web
cd $PROJECT_ROOT/frontend
pm2 start npm --name "${APP_NAME}-web" -- start -- -p ${WEB_PORT}

pm2 save

echo "✅ Deployment Complete!"
echo "   API (${APP_NAME}-api): Port ${API_PORT}"
echo "   Web (${APP_NAME}-web): Port ${WEB_PORT}"
