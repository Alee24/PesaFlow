# Repair Server Hard Reset

## SSH into your VPS
ssh root@mclinic

## Navigate to project directory
cd /var/www/mpesaconnect.co.ke/backend

## Force Reset to match GitHub (Discard local changes)
git fetch origin
git reset --hard origin/main

## Clean Install (Remove bad cache)
rm -rf node_modules dist .next

## Rebuild and Restart
npm install
npm run build
pm2 restart pesaflow-api

## Verify Logs
pm2 logs pesaflow-api --lines 50
