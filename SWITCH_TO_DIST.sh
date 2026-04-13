# Switch to Compiled JS
ssh root@mclinic

# Go to backend
cd /var/www/mpesaconnect.co.ke/backend

# Verify build
npm run build

# Delete the old ts-node process
pm2 delete Mpesa Connect-api

# Start the new process using dist/server.js
# This is much faster and stable in production
pm2 start dist/server.js --name "Mpesa Connect-api" --cwd /var/www/mpesaconnect.co.ke/backend --node-args="-r dotenv/config"

# Check status
pm2 status
pm2 logs Mpesa Connect-api --lines 50
