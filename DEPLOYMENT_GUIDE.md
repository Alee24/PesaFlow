# Mpesa Connect Server Deployment Guide

## Prerequisites on Your VPS

1. **Node.js & npm** installed
2. **MySQL** running (you mentioned it's already set up)
3. **Apache** configured as reverse proxy
4. **PM2** for process management (recommended)
5. **Git** installed

## Step-by-Step Deployment

### 1. SSH into Your Server

```bash
ssh your-username@your-server-ip
```

### 2. Navigate to Your Project Directory

```bash
cd /var/www/Mpesa Connect  # or wherever your project is located
```

### 3. Pull Latest Changes

```bash
git pull origin main
```

### 4. Backend Deployment

```bash
cd backend

# Install new dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Build TypeScript
npm run build

# Restart backend with PM2
pm2 restart Mpesa Connect-backend
# OR if not using PM2:
# systemctl restart Mpesa Connect-backend
```

### 5. Frontend Deployment

```bash
cd ../frontend

# Install new dependencies
npm install

# Build Next.js production bundle
npm run build

# Restart frontend with PM2
pm2 restart Mpesa Connect-frontend
# OR if not using PM2:
# systemctl restart Mpesa Connect-frontend
```

### 6. Verify Services

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs Mpesa Connect-backend --lines 50
pm2 logs Mpesa Connect-frontend --lines 50
```

## Quick One-Line Deployment

If you've set up the deployment script:

```bash
chmod +x deploy_to_server.sh
./deploy_to_server.sh
```

## Environment Variables

Make sure your server has the correct `.env` files:

### Backend `.env`
```env
DATABASE_URL="mysql://user:password@localhost:3306/Mpesa Connect"
JWT_SECRET="your-secret-key"
PORT=5454

# M-Pesa Configuration
MPESA_CONSUMER_KEY="your-key"
MPESA_CONSUMER_SECRET="your-secret"
MPESA_PASSKEY="your-passkey"
MPESA_SHORTCODE="your-shortcode"
MPESA_ENV="production"
MPESA_CALLBACK_URL="https://yourdomain.com/api/mpesa/callback"
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

## Apache Configuration

Your Apache should proxy to the Node.js services:

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    
    # Frontend proxy
    ProxyPass / http://localhost:2424/
    ProxyPassReverse / http://localhost:2424/
    
    # Backend API proxy
    ProxyPass /api http://localhost:5454/api
    ProxyPassReverse /api http://localhost:5454/api
    
    # WebSocket support for Next.js hot reload (dev only)
    RewriteEngine on
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:2424/$1" [P,L]
</VirtualHost>
```

## PM2 Setup (First Time)

If you haven't set up PM2 yet:

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd backend
pm2 start dist/server.js --name Mpesa Connect-backend

# Start frontend
cd ../frontend
pm2 start npm --name Mpesa Connect-frontend -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on server reboot
pm2 startup
```

## Database Migrations

The new features include:
- Loyalty system tables
- POS authentication tables
- Updated payment tracking

These will be created automatically when you run:
```bash
npx prisma migrate deploy
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
pm2 logs Mpesa Connect-backend

# Check if port is in use
netstat -tulpn | grep 5454

# Restart MySQL
systemctl restart mysql
```

### Frontend build fails
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Database connection issues
```bash
# Test MySQL connection
mysql -u your_user -p Mpesa Connect

# Check DATABASE_URL in .env
cat backend/.env | grep DATABASE_URL
```

## Post-Deployment Checklist

- [ ] Backend is running on port 5454
- [ ] Frontend is running on port 2424
- [ ] Apache is proxying correctly
- [ ] Database migrations completed
- [ ] M-Pesa callbacks are working
- [ ] Kiosk mode loads staff members
- [ ] Payment modal shows status checking
- [ ] Loyalty system is accessible

## Rollback (If Needed)

```bash
# Go back to previous commit
git log --oneline  # Find previous commit hash
git reset --hard <previous-commit-hash>

# Redeploy
./deploy_to_server.sh
```
