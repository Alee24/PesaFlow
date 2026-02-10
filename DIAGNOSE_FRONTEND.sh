#!/bin/bash
echo "=== PM2 Frontend Status (ID 4) ==="
pm2 show 4

echo -e "\n=== Frontend Logs (Last 50 lines) ==="
pm2 logs 4 --lines 50 --nostream

echo -e "\n=== Port 3001 Usage (Frontend) ==="
netstat -tulpn | grep 3001

echo -e "\n=== Checking Frontend .env ==="
cd /var/www/mpesaconnect.co.ke/frontend
cat .env | grep PORT
cat .env | grep HOST

echo -e "\n=== Manual Connection Test to Frontend ==="
curl -I http://localhost:3001
