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
pm2 delete Mpesa Connect-api || true
pm2 start dist/server.js --name Mpesa Connect-api
cd ../frontend
npm install
npm run build
pm2 delete Mpesa Connect-web || true
pm2 start npm --name Mpesa Connect-web -- start -- -p 5054
pm2 save
pm2 status
