# Production Server Update Commands (REVERT)

## SSH into your VPS
ssh root@mclinic

## Navigate to project directory
cd /var/www/mpesaconnect.co.ke

## Pull latest changes from GitHub (This will revert the changes)
git pull origin main

## Update backend
cd backend
npm install
pm2 restart Mpesa Connect-api

## Check PM2 status
pm2 status

## View logs if needed
pm2 logs Mpesa Connect-api --lines 50
