#!/bin/bash
echo "=== Apache sites-enabled ==="
ls /etc/apache2/sites-enabled/

echo -e "\n=== mpesaconnect.co.ke Config ==="
cat /etc/apache2/sites-enabled/mpesaconnect.co.ke.conf || cat /etc/apache2/sites-enabled/000-default.conf

echo -e "\n=== Apache Proxy Error Logs (Last 50 lines) ==="
grep "proxy" /var/log/apache2/error.log | tail -n 50

echo -e "\n=== Testing Backend Connectivity from Server ==="
echo "Testing 127.0.0.1:5454..."
curl -I http://127.0.0.1:5454/
echo "Testing localhost:5454..."
curl -I http://localhost:5454/
echo "Testing 0.0.0.0:5454..."
curl -I http://0.0.0.0:5454/
