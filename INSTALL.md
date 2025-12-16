
# M-Pesa SaaS Platform - Installation Guide

Welcome! This guide will help you install and configure the platform on your server.

## Quick Installation (The "Easy" Way)

We have built a graphical installer to make setup simple.

### 1. Start the Application
First, open a terminal in the project folder and run:

**Backend:**
```bash
cd backend
npm install  # (If first time)
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install  # (If first time)
npm run dev
```

### 2. Open the Installer
Open your web browser and go to:
👉 **[http://localhost:3000/install](http://localhost:3000/install)**

*(If your server is remote, replace `localhost` with your server IP)*

### 3. Fill in the Details
The installer will guide you through 3 steps:

*   **Database**: Enter your MySQL Host, User, Password, and Database Name (e.g., `pesaflow`). The installer will automatically create the tables for you.
*   **M-Pesa**: Enter your Consumer Key, Secret, Passkey, and Shortcode (Paybill/Till Number).
*   **Email (Optional)**: Enter your SMTP details for email notifications.

### 4. Restart
After clicking "Complete Installation", the system will save your settings to a `.env` file.
**You must restart the backend server** (Press `Ctrl+C` then `npm run dev` again) for the changes to take effect.

---

## Technical Details (For Admins)

The installer does the following:
1.  Creates/Updates the `backend/.env` file.
2.  Runs `npx prisma db push` to initialize the database schema.

### Manual Configuration
If you prefer to configure manually, edit `backend/.env` directly:

```env
DATABASE_URL="mysql://user:pass@host:3306/dbname"
MPESA_CONSUMER_KEY="..."
MPESA_CONSUMER_SECRET="..."
# ... see .env.example for all fields
```
