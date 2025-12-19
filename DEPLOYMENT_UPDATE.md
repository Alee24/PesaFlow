
# 🚀 PesaFlow - Deployment Update Guide

If you have deployed the application and need to update it with the latest changes (like the new Admin credentials or Database schema updates), follow these steps on your server.

## 1. Get the Latest Code
Navigate to your project folder and pull the latest changes from git:

```bash
cd /path/to/Anti-gravity
git pull origin main
```

## 2. Update Backend & Database (CRITICAL)
This is where most login/database issues happen. You must update dependencies and the database schema.

```bash
cd backend

# 1. Install any new dependencies
npm install

# 2. Update the Prisma Client (connects code to DB)
npx prisma generate

# 3. Update the Database Schema (Changes tables/columns)
npx prisma db push
# OR if using migrations: npx prisma migrate deploy

# 4. Update Admin Credentials (CRITICAL for your login issue)
# This runs the script to update the Super Admin to mettoalex@gmail.com
npx ts-node seed-users.ts

# 5. Build/Restart Backend (if running via PM2 or Node)
# Example if using PM2:
pm2 restart backend
```

## 3. Update Frontend
Update the user interface to get the new POS layout and features.

```bash
cd ../frontend

# 1. Install dependencies
npm install

# 2. Build the Next.js application
npm run build

# 3. Restart Frontend
# Example if using PM2:
pm2 restart frontend
```

---

## 🔍 Troubleshooting

**"I still can't login!"**
- Did you run `npx ts-node seed-users.ts` inside the `backend` folder?
- Check your logs: `pm2 logs backend`.
- Ensure your database connection in `.env` is correct.

**"The database isn't updating!"**
- Run `npx prisma db push` manually to force the schema sync.
