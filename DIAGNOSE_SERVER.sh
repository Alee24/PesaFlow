#!/bin/bash
echo "=== PM2 Status ==="
pm2 status

echo -e "\n=== Port 5454 Usage ==="
netstat -tlpn | grep 5454

echo -e "\n=== Backend Logs (Last 50 lines) ==="
pm2 logs Mpesa Connect-api --lines 50 --nostream

echo -e "\n=== Apache Error Logs (Last 20 lines) ==="
tail -n 20 /var/log/apache2/error.log

echo -e "\n=== Test Local Connection ==="
curl -v http://localhost:5454/api/health || echo "Failed to connect locally"
