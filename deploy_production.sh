#!/bin/bash
set -e

cd /var/www/mpesaconnect.co.ke
git fetch origin
git reset --hard origin/main
cd backend
npm install
npx prisma generate
npx prisma db push --accept-data-loss
npm run build
pm2 delete pesaflow-api || true
pm2 start dist/server.js --name pesaflow-api
cd ../frontend
npm install
npm run build
pm2 delete pesaflow-web || true
pm2 start npm --name pesaflow-web -- start -- -p 5054
pm2 save
pm2 status
