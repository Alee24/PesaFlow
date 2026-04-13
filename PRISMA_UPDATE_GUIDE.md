# Commands to Update Prisma Schema and Deploy to Server

## Step 1: Commit and Push Migration to Git

```bash
cd "c:\Users\Metto\Desktop\Anti gravity"

# Add all changes
git add .

# Commit
git commit -m "feat: Add sbn_number migration for BusinessProfile"

# Push to GitHub
git push origin main
```

## Step 2: Deploy on Server

SSH into your server and run:

```bash
cd /var/www/mpesaconnect.co.ke

# Pull latest changes
git pull origin main

# Navigate to backend
cd backend

# Run the migration SQL directly
mysql -u your_username -p mpesaconnect < prisma/migrations/add_sbn_number.sql

# OR run it as a single command:
mysql -u your_username -p mpesaconnect -e "ALTER TABLE business_profiles ADD COLUMN sbn_number VARCHAR(191) NULL;"

# Regenerate Prisma Client
npx prisma generate

# Restart backend
pm2 restart Mpesa Connect-api

# Check logs
pm2 logs Mpesa Connect-api --lines 20
```

## Step 3: Clean Up Duplicate PM2 Processes

```bash
# Delete duplicate Mpesa Connect-web instances
pm2 delete 6
pm2 delete 7

# Save PM2 configuration
pm2 save

# Check status
pm2 status
```

## Quick One-Liner for Migration

```bash
mysql -u your_username -p mpesaconnect -e "ALTER TABLE business_profiles ADD COLUMN sbn_number VARCHAR(191) NULL;"
```

Replace `your_username` with your actual MySQL username.
