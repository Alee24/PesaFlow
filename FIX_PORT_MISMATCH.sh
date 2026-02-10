# Fix Port Mismatch (503 Service Unavailable)
ssh root@mclinic

# Go to backend
cd /var/www/mpesaconnect.co.ke/backend

# Use sed to update PORT in .env to 3002
# (Doing it safely: removing existing PORT and adding the correct one)
sed -i '/PORT=/d' .env
echo "PORT=3002" >> .env

# Restart the backend with the new port
pm2 restart pesaflow-api

# Check binding (should show 0.0.0.0:3002)
netstat -tulpn | grep 3002

# Test connectivity locally
curl -I http://localhost:3002/
