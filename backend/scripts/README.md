# Database Reset Script

This script clears all data from the database and reseeds it with default users and sample data.

## ⚠️ WARNING
**This script will DELETE ALL DATA in your database!** Use with extreme caution, especially in production.

## Usage

### Development
```bash
cd backend
npm run db:reset
```

### Production (with confirmation)
```bash
cd backend
# Make sure you really want to do this!
npm run db:reset
```

## What it does

1. **Deletes all data** from all tables in the correct order
2. **Creates default users**:
   - Admin user
   - Test merchant with PRO subscription
   - Branch manager
3. **Seeds sample data**:
   - 3 product categories
   - 3 sample products
   - Wallets for all users

## Default Credentials

After running the script, you can log in with:

### Admin
- **Email**: `admin@mpesaconnect.co.ke`
- **Password**: `Digital2025`

### Merchant
- **Email**: `mettoalex@gmail.com`
- **Password**: `Digital2025`
- **Subscription**: PRO (1 year)

### Branch Manager
- **Email**: `branch@mpesaconnect.co.ke`
- **Password**: `Digital2025`
- **Parent**: Test Merchant

## Sample Data Created

- **Categories**: Electronics, Clothing, Food & Beverages
- **Products**: 3 sample products with stock
- **Wallets**: Created for all users with 0 balance

## When to use

- Setting up a fresh development environment
- Resetting test data
- Cleaning up after testing
- Starting fresh with known credentials

## Safety

The script will:
- ✅ Show progress for each step
- ✅ Display all created credentials at the end
- ✅ Properly disconnect from the database
- ✅ Exit with appropriate status codes

## Troubleshooting

If the script fails:
1. Check your database connection in `.env`
2. Ensure Prisma schema is up to date: `npx prisma generate`
3. Check for foreign key constraints
4. Review error messages for specific issues
