#!/bin/bash
echo "=== Diagnosing Port Binding ==="

# Check environment file
echo "Checking .env contents (sensitive hidden):"
grep "PORT=" .env
grep "HOST=" .env

# Check currently listening ports
echo -e "\n=== Listening Ports (netstat) ==="
netstat -tulpn

# Check specific port 5454
echo -e "\n=== Specific Port 5454 usage ==="
lsof -i :5454 || echo "No process on 5454"

# Check process list for node
echo -e "\n=== Node Processes ==="
ps aux | grep node | grep pesaflow-api

# Check PM2 detailed status
echo -e "\n=== PM2 Details ==="
pm2 show pesaflow-api | grep "exec mode"
pm2 show pesaflow-api | grep "interpreter"
pm2 show pesaflow-api | grep "cwd"

# Attempt manual binding test (Node one-liner)
echo -e "\n=== Test Bind ==="
node -e "const http = require('http'); const server = http.createServer((req, res) => res.end('ok')); server.listen(5455, '0.0.0.0', () => console.log('Test bind success on 5455')); server.on('error', (err) => console.log('Test bind failing:', err.message)); setTimeout(() => process.exit(0), 1000);"
