# Production Server Commands

## Full Deployment (Pull from Git + Rebuild)

```bash
cd /var/www/mpesaconnect.co.ke && git fetch origin && git reset --hard origin/main && cd backend && npm install && npx prisma generate && npx prisma db push --accept-data-loss && npm run build && pm2 delete Mpesa Connect-api || true && pm2 start dist/server.js --name Mpesa Connect-api && cd ../frontend && npm install && npm run build && pm2 delete Mpesa Connect-web || true && pm2 start npm --name Mpesa Connect-web -- start -- -p 5054 && pm2 save && pm2 status
```

## Quick Restart (No Rebuild)

```bash
pm2 restart Mpesa Connect-api && pm2 restart Mpesa Connect-web && pm2 status
```

## Backend Only

```bash
cd /var/www/mpesaconnect.co.ke && git pull && cd backend && npm install && npx prisma generate && npm run build && pm2 restart Mpesa Connect-api && pm2 logs Mpesa Connect-api --lines 50
```

## Frontend Only

```bash
cd /var/www/mpesaconnect.co.ke && git pull && cd frontend && npm install && npm run build && pm2 restart Mpesa Connect-web && pm2 logs Mpesa Connect-web --lines 50
```

## Database Only

```bash
cd /var/www/mpesaconnect.co.ke/backend && npx prisma generate && npx prisma db push --accept-data-loss && pm2 restart Mpesa Connect-api
```

## Check Status

```bash
pm2 status && pm2 logs --lines 20 --nostream
```

## View Logs

```bash
pm2 logs Mpesa Connect-api --lines 100
```

```bash
pm2 logs Mpesa Connect-web --lines 100
```

```bash
pm2 logs --lines 50 --nostream
```

## Stop All

```bash
pm2 stop all
```

## Start All

```bash
pm2 start all
```

## Delete and Recreate

```bash
pm2 delete Mpesa Connect-api Mpesa Connect-web && cd /var/www/mpesaconnect.co.ke/backend && pm2 start dist/server.js --name Mpesa Connect-api && cd ../frontend && pm2 start npm --name Mpesa Connect-web -- start -- -p 5054 && pm2 save
```

## Fix Port in .env

```bash
cd /var/www/mpesaconnect.co.ke/backend && sed -i 's/^PORT=.*/PORT=5454/' .env && cat .env | grep PORT
```

## Check Database Connection

```bash
cd /var/www/mpesaconnect.co.ke/backend && npx prisma db push
```

## Check Ports

```bash
netstat -tulpn | grep -E ':(5454|5054|3434|3034)'
```

## Kill Process on Port

```bash
lsof -ti:5454 | xargs kill -9
```

```bash
lsof -ti:5054 | xargs kill -9
```

## Test API

```bash
curl http://localhost:5454/api/health
```

## Check Disk Space

```bash
df -h
```

## Check Memory

```bash
free -h
```

## Clean npm cache

```bash
cd /var/www/mpesaconnect.co.ke/backend && npm cache clean --force && cd ../frontend && npm cache clean --force
```

## Reset Everything

```bash
cd /var/www/mpesaconnect.co.ke && git fetch origin && git reset --hard origin/main && pm2 delete all || true && cd backend && rm -rf node_modules dist && npm install && npx prisma generate && npx prisma db push --accept-data-loss && npm run build && pm2 start dist/server.js --name Mpesa Connect-api && cd ../frontend && rm -rf node_modules .next && npm install && npm run build && pm2 start npm --name Mpesa Connect-web -- start -- -p 5054 && pm2 save && pm2 status
```
