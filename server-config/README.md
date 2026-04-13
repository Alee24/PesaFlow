# Mpesa Connect - Server Configuration Guide

## Quick Setup

### 1. Environment Files

**Backend** (`/var/www/mpesaconnect.co.ke/backend/.env`):
```bash
sudo nano /var/www/mpesaconnect.co.ke/backend/.env
```
Copy contents from `backend.env.example` and update with your actual values.

**Frontend** (`/var/www/mpesaconnect.co.ke/frontend/.env.local`):
```bash
sudo nano /var/www/mpesaconnect.co.ke/frontend/.env.local
```
Copy contents from `frontend.env.example`.

### 2. Apache Configuration

**HTTP Config**:
```bash
sudo nano /etc/apache2/sites-available/mpesaconnect.co.ke.conf
```
Copy contents from `apache-http.conf`.

**SSL Config**:
```bash
sudo nano /etc/apache2/sites-available/mpesaconnect.co.ke-le-ssl.conf
```
Copy contents from `apache-ssl.conf`.

**Enable sites and restart Apache**:
```bash
sudo a2ensite mpesaconnect.co.ke.conf
sudo a2ensite mpesaconnect.co.ke-le-ssl.conf
sudo systemctl restart apache2
```

### 3. PM2 Process Management

**Start services**:
```bash
# Backend (port 3002)
cd /var/www/mpesaconnect.co.ke/backend
PORT=3002 pm2 start dist/server.js --name Mpesa Connect-backend

# Frontend (port 3001)
cd /var/www/mpesaconnect.co.ke/frontend
PORT=3001 pm2 start npm --name Mpesa Connect-frontend -- start

# Save PM2 configuration
pm2 save
```

**Manage services**:
```bash
pm2 list                    # List all services
pm2 logs Mpesa Connect-backend   # View backend logs
pm2 logs Mpesa Connect-frontend  # View frontend logs
pm2 restart all             # Restart all services
pm2 stop all                # Stop all services
```

### 4. Deployment

**Standard deployment**:
```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

**Fresh deployment** (⚠️ Deletes all data):
```bash
chmod +x deploy-fresh.sh
sudo ./deploy-fresh.sh
```

### 5. Database Seeding

**Create admin account**:
```bash
cd /var/www/mpesaconnect.co.ke/backend
npx ts-node seed-admin.ts
```

Default admin credentials:
- Email: `mettoalex@gmail.com`
- Password: `Digital2025`

## Port Configuration

- **Frontend**: Port 3001
- **Backend**: Port 3002
- **Apache HTTP**: Port 80 (redirects to HTTPS)
- **Apache HTTPS**: Port 443

## Troubleshooting

### Site not loading
```bash
# Check Apache status
sudo systemctl status apache2

# Check PM2 services
pm2 list

# Test local connections
curl -I http://localhost:3001  # Frontend
curl -I http://localhost:3002  # Backend
```

### Connection errors
```bash
# Verify .env.local exists
cat /var/www/mpesaconnect.co.ke/frontend/.env.local

# Should contain:
# NEXT_PUBLIC_API_URL=https://mpesaconnect.co.ke/api
```

### Apache errors
```bash
# Test configuration
sudo apache2ctl configtest

# View error logs
sudo tail -50 /var/log/apache2/mpesaconnect_ssl_error.log
```

### PM2 issues
```bash
# Delete all processes and start fresh
pm2 delete all
pm2 kill

# Start services again
cd /var/www/mpesaconnect.co.ke/backend
PORT=3002 pm2 start dist/server.js --name Mpesa Connect-backend

cd ../frontend
PORT=3001 pm2 start npm --name Mpesa Connect-frontend -- start

pm2 save
```

## File Locations

- **Backend code**: `/var/www/mpesaconnect.co.ke/backend`
- **Frontend code**: `/var/www/mpesaconnect.co.ke/frontend`
- **Apache configs**: `/etc/apache2/sites-available/`
- **SSL certificates**: `/etc/letsencrypt/live/mpesaconnect.co.ke/`
- **PM2 logs**: `~/.pm2/logs/`
- **Apache logs**: `/var/log/apache2/`

## Important Commands

```bash
# Restart everything
pm2 restart all && sudo systemctl restart apache2

# View all logs
pm2 logs

# Check what's using ports
sudo lsof -i :3001
sudo lsof -i :3002

# Update from GitHub
cd /var/www/mpesaconnect.co.ke
git pull origin main
```
