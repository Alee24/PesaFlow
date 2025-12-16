
# PesaFlow - Installation Guide

Welcome! This guide will help you install and configure the PesaFlow platform on your server.

## Quick Installation (The "Easy" Way)

We have built a graphical installer to make setup simple and error-free.

### 1. Start the Application
First, ensure you have the node modules installed and start both services.

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 2. Open the Installer
Open your web browser and go to:
👉 **[http://localhost:2424/install](http://localhost:2424/install)**

*(If your server is remote, replace `localhost` with your server IP)*

### 3. Fill in the Details
The installer will guide you through **4 Steps**:

1.  **Database Config**: Enter your MySQL Host, User, Password, and Database Name (e.g., `pesaflow`). The installer will automatically create the schema.
    *   *Note: If testing locally, you can use the default SQLite setting if you prefer, but MySQL is required for production.*
2.  **M-Pesa Config**: Enter your **Production** or **Sandbox** credentials.
    *   Consumer Key & Secret
    *   Passkey & Shortcode
    *   **Callback URL**: This MUST be a public URL (e.g., `https://api.yourdomain.com/api/mpesa/callback`) for live payments to work.
3.  **Server Settings**: Configure your JWT Secret (for security) and SMTP details (for emails).
4.  **Admin Account Setup**: **(New)** Create your **Super Admin** account. This user will have full access to the Admin Portal and system settings.

### 4. Restart & Go Live
After clicking "Complete Installation", the system will save your settings to the `backend/.env` file.

**⚠️ CRITICAL STEP: Restart the Backend**
You must restart the backend server for the new environment variables to load:
1.  Go to your Backend terminal.
2.  Press `Ctrl + C` to stop the server.
3.  Run `npm run dev` (or `npm start` for production) again.

---

## Technical Details (Manual Setup)

If you prefer to configure the system manually without the wizard:

1.  **Rename** `backend/.env.example` (if exists) to `backend/.env`.
2.  **Edit** `backend/.env` with your details:

```env
# Database
DATABASE_URL="mysql://user:pass@host:3306/pesaflow"

# Security
JWT_SECRET="complex_secret_key"

# M-Pesa (Production Example)
MPESA_CONSUMER_KEY="your_key"
MPESA_CONSUMER_SECRET="your_secret"
MPESA_PASSKEY="your_passkey"
MPESA_SHORTCODE="300977"
MPESA_ENV="production"
MPESA_CALLBACK_URL="https://your-domain.com/api/mpesa/callback"
```

3.  **Initialize Database**:
```bash
cd backend
npx prisma db push
```

4.  **Create Admin User**:
    *   You will need to manually insert a user with `role: "ADMIN"` into the database if skipping the wizard.
