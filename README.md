# PesaFlow - M-Pesa SaaS Platform

PesaFlow is a modern SaaS platform designed for merchants to manage business operations seamlessly. It enables product management, point-of-sale (POS) processing via M-Pesa STK Push, withdrawal requests, and comprehensive financial reporting. The platform features a robust Admin Dashboard, PDF Invoicing, and Multi-role Access Control.

## 🚀 Features

-   **Point of Sale (POS)**: Initiate instant M-Pesa payments (STK Push) for customers.
-   **Dashboard & Analytics**: Real-time insights into sales, revenue, and daily performance.
-   **Admin Portal**: Specialized dashboard for Super Admins to monitor system health, user activity, and revenues.
-   **Wallet System**: Merchants have digital wallets to track earnings and request withdrawals.
-   **PDF Invoicing**: Generate professional, print-ready PDF invoices for transactions.
-   **Role-Based Access**: Secure separation between Merchants and Admins.
-   **Automated Setup**: Built-in Installation Wizard for easy deployment.

---

## 🛠 Prerequisites

-   **Node.js** (v18 or higher)
-   **npm** (Node Package Manager)
-   **Database**: MySQL (Recommended for Production) or SQLite (Dev only).

---

## 📦 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository_url>
cd pesaflow
```

### 2. Install Dependencies
Install packages for both the backend and frontend services.

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

### 3. Database Configuration
By default, the system is configured for **MySQL**.

1.  Create a MySQL database (e.g., `pesaflow`).
2.  The application uses `prisma` to manage the schema. The connection string will be set during the installation wizard or manually in `.env`.

---

## ⚡ Running the Application

You need to run the Backend and Frontend in separate terminals.

**Terminal 1: Backend**
```bash
cd backend
npm run dev
```
*Server running on http://localhost:3001*

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
```
*Frontend running on http://localhost:2424*

---

##  wizard Configuration (Recommended)

1.  Open your browser and navigate to **[http://localhost:2424/install](http://localhost:2424/install)**.
2.  Follow the **4-Step Installation Wizard**:
    *   **Step 1**: Database Connection (MySQL recommended).
    *   **Step 2**: M-Pesa API Credentials (Consumer Key, Secret, Passkey).
    *   **Step 3**: Server & Email Settings.
    *   **Step 4**: **Super Admin Account Setup** (Create your primary admin user).
3.  Upon completion, the system will generate the `.env` file and initialize the database.
4.  **Restart the Backend** server to apply changes.

---

## 🧪 M-Pesa Integration Testing

We provide built-in tools to verify your credentials before going live.

**Via Dashboard:**
Go to **Settings > M-Pesa Integration** and click "Test Connection".

**Via CLI:**
```bash
cd backend
npx ts-node src/scripts/verify-mpesa.ts
```
*This script tests connectivity to Safaricom's API using your `.env` credentials.*

### ⚠️ Important for Live Production
For M-Pesa to confirm payments, your backend must be accessible from the internet.
1.  **Callback URL**: Set `MPESA_CALLBACK_URL` in `.env` to your public domain (e.g., `https://your-domain.com/api/mpesa/callback`).
2.  **Localhost**: For local testing, use **Ngrok** to check live callbacks.

---

## 🔐 Admin Portal

The Admin Portal is restricted to users with the `ADMIN` role.
-   **Access**: Log in with the account created during Step 4 of installation.
-   **Features**: View system-wide stats, manage merchants (future), and oversee transaction volumes.
-   **Security**: Regular merchants cannot access this route; they are redirected to their User Dashboard.

---

## 📄 Invoicing

-   **Automatic Generation**: Every completed transaction generates an invoice.
-   **PDF Download**: Users can download high-quality PDF invoices directly from the Transaction Details page.
-   **Customization**: Invoices pull business details (Logo, VAT, Contact) from the "Settings" page.

---

## 🆘 Troubleshooting

-   **Prisma/Database Errors**:
    -   Ensure your MySQL server is running.
    -   If switching databases (SQLite <-> MySQL), delete the `node_modules` folder inside backend and re-run `npm install` and `npx prisma generate`.
-   **PDF Generating Issues**:
    -   Ensure `frontend` build utilizes the dynamic import for `@react-pdf/renderer` as implemented.
