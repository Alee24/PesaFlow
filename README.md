# M-Pesa SaaS Platform - Installation & Setup Guide

This project is a SaaS platform enabling merchants to manage products, process sales via M-Pesa STK Push, and request withdrawals. It features a Next.js Frontend and an Express/Node.js Backend.

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** (Node Package Manager)
- **Git**
- **Databases Supported**: SQLite (default for dev), MySQL, or PostgreSQL.

---

## 1. Project Setup

### Clone/Navigate to the Project
```bash
cd "c:/Users/Metto/Desktop/Anti gravity" 
# Or wherever you have placed the project files
```

### Install Dependencies

You need to install dependencies for both the Backend and Frontend.

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

---

## 2. Configuration

### Backend Environment Variables (`.env`)

Navigate to the `backend` directory and ensure you have a `.env` file. A template is provided below:

**File:** `backend/.env`
```env
# --- Database Configuration ---
# OPTION 1: SQLite (Default - Easiest for Local Dev)
DATABASE_URL="file:./dev.db"

# OPTION 2: MySQL (For Production/Remote)
# DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"

# --- Server Configuration ---
PORT=3001
JWT_SECRET="your_super_secret_jwt_key"

# --- M-Pesa Daraja API Credentials ---
# Login to Safaricom Developer Portal to get these.
MPESA_CONSUMER_KEY="your_consumer_key"
MPESA_CONSUMER_SECRET="your_consumer_secret"
MPESA_PASSKEY="your_passkey"
MPESA_SHORTCODE="your_shortcode" # e.g. 174379 for Sandbox
MPESA_ENV="sandbox" # or "production"
MPESA_CALLBACK_URL="http://localhost:3001/api/mpesa/callback" 
# Note: For callbacks to work locally, use Ngrok to expose localhost:3001
```

---

## 3. Database Setup

Initialize the database schema using Prisma.

**For SQLite (If using `file:./dev.db`):**
```bash
cd backend
npx prisma db push
```

**For MySQL (If using remote DB):**
1. Update `DATABASE_URL` in `.env`.
2. Update `backend/prisma/schema.prisma` provider to `"mysql"`.
3. Run:
```bash
npx prisma db push
```

---

## 4. Running the Application

You need to run the Backend and Frontend in separate terminals.

### Terminal 1: Backend
```bash
cd backend
npm run dev
```
*Server running on http://localhost:3001*

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```
*Frontend running on http://localhost:3000*

---

## 5. Usage

1.  **Open Browser**: Go to [http://localhost:3000](http://localhost:3000).
2.  **Login/Register**:
    *   You will be redirected to the Login page.
    *   Click "Register" to create a new Merchant account.
3.  **Dashboard**: Once logged in, you can access the Dashboard.
4.  **POS System**:
    *   Go to **POS System**.
    *   Add products to cart (create products first in "Products" page).
    *   Enter Customer Phone (e.g., `2547...`) and Click "Charge".
    *   This triggers the M-Pesa STK Push.

---

## 6. M-Pesa Testing Tools

We have included scripts to verify your M-Pesa credentials before running the full app.

**Run Test Script:**
```bash
cd backend
npx ts-node src/scripts/test-mpesa.ts
```
*This will attempt to authenticate and send a test STK Push request using settings in your `.env`.*

---

## Troubleshooting

-   **Database Connection Failed**:
    -   If using MySQL, ensure the remote server allows connections from your IP (check Firewall/UFW).
    -   Ensure MySQL `bind-address` is `0.0.0.0`.
-   **M-Pesa Errors**:
    -   `Invalid Access Token`: Check Consumer Key/Secret. Ensure "Lipa na M-Pesa" is enabled in your Daraja App.
    -   `Merchant does not exist`: Your Shortcode is incorrect or not active in Sandbox. Use generic `174379` for testing.
