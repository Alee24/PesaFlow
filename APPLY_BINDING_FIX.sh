# Apply Server Binding Fix
ssh root@mclinic

# Go to backend
cd /var/www/mpesaconnect.co.ke/backend

# Pull the fix
git pull origin main

# Rebuild (since we changed server.ts)
npm run build

# Ensure HOST is set in .env
grep "HOST=" .env || echo "HOST=0.0.0.0" >> .env

# Restart server
pm2 restart Mpesa Connect-api

# Check status
pm2 logs Mpesa Connect-api --lines 50
