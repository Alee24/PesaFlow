# Fix Apache IPv6 Connection Issue
ssh root@mclinic

# Go to backend
cd /var/www/mpesaconnect.co.ke/backend

# Add IPv4 Host Binding to .env (Forces Node to bind 0.0.0.0)
echo "HOST=0.0.0.0" >> .env
# Also set explicit loopback for safety
grep "PORT=" .env || echo "PORT=5454" >> .env

# Restart server
pm2 restart pesaflow-api

# Check binding
netstat -tulpn | grep 5454
