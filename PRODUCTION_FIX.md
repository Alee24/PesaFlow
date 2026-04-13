# Quick Fix for Production Server

## Problem
The loyalty system tables don't exist in your production database, causing build failures.

## Solution 1: Remove Loyalty Features (Quick Fix)

Run these commands on your server:

```bash
cd /var/www/mpesaconnect.co.ke/backend

# Temporarily rename loyalty files to exclude them from build
mv src/controllers/loyalty.controller.ts src/controllers/loyalty.controller.ts.disabled
mv src/routes/loyalty.routes.ts src/routes/loyalty.routes.ts.disabled

# Remove loyalty import from app.ts
sed -i '/loyalty/d' src/app.ts

# Rebuild
npm run build

# Start backend
pm2 start dist/server.js --name Mpesa Connect-api

# Check status
pm2 logs Mpesa Connect-api --lines 20
```

## Solution 2: Add Loyalty Tables (Proper Fix)

If you want to keep loyalty features, add the tables:

```bash
cd /var/www/mpesaconnect.co.ke/backend

# Run this SQL to create loyalty tables
mysql -u m-cl-app -p mpesaconnect << 'EOF'
CREATE TABLE IF NOT EXISTS loyalty_customers (
  id VARCHAR(191) PRIMARY KEY,
  merchant_id VARCHAR(191) NOT NULL,
  phone_number VARCHAR(191),
  id_number VARCHAR(191),
  card_number VARCHAR(191),
  name VARCHAR(191),
  email VARCHAR(191),
  total_points INT DEFAULT 0,
  available_points INT DEFAULT 0,
  lifetime_points INT DEFAULT 0,
  last_visit DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id VARCHAR(191) PRIMARY KEY,
  customer_id VARCHAR(191) NOT NULL,
  sale_id VARCHAR(191),
  type VARCHAR(50) NOT NULL,
  points INT NOT NULL,
  description TEXT,
  balance_before INT,
  balance_after INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES loyalty_customers(id),
  FOREIGN KEY (sale_id) REFERENCES sales(id)
);

-- Add loyalty fields to business_profiles
ALTER TABLE business_profiles 
  ADD COLUMN IF NOT EXISTS loyalty_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS points_per_kes DECIMAL(10,2) DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS kes_per_point DECIMAL(10,2) DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS min_redeem_points INT DEFAULT 100;
EOF

# Then rebuild
npx prisma generate
npm run build
pm2 restart Mpesa Connect-api
```

## Recommended: Use Solution 1 for now

Since you need the server running ASAP, use Solution 1 to disable loyalty features temporarily.
