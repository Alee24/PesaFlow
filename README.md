# PesaFlow - M-Pesa SaaS Platform

PesaFlow is a premium SaaS platform designed for merchants to manage business operations with modern aesthetics and robust functionality. It enables product management, point-of-sale (POS) processing via M-Pesa STK Push, withdrawal requests with admin oversight, and comprehensive financial reporting.

## 🚀 Key Features

-   **Point of Sale (POS)**: Professional interface for initiating M-Pesa payments (STK Push).
-   **Withdrawal Approvals**: Multi-step workflow where Admins review and approve/reject merchant withdrawal requests.
-   **Platform Revenue Tracking**: Admins can track service fees (2.5 KES per transaction + 2% withdrawal fee).
-   **Dashboard & Analytics**: Real-time insights with high-fidelity charts and automated net income calculation.
-   **Professional PDF Reporting**: High-quality, print-ready transaction statements and invoices.
-   **KRA Compliance**: Native support for **KRA PIN** and VAT configuration on invoices.
-   **Audio-Visual Feedback**: Smart notifications with 5-second auto-hide and subtle audio cues.
-   **Role-Based Access**: Secured separation between Merchants and Admins with strict data isolation.

---

## 🛠 Prerequisites

-   **Node.js** (v18 or higher)
-   **npm** (Node Package Manager)
-   **Database**: MySQL (Production) or SQLite (Development).

---

## 📦 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository_url>
cd pesaflow
```

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install
npx prisma generate

# Frontend
cd ../frontend
npm install
```

### 3. Database Configuration
By default, the system uses **MySQL**. Configure your credentials in `backend/.env`.

---

## ⚡ Running the Application

**Terminal 1: Backend**
```bash
cd backend
npm run dev
```

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
```

---

## 🔐 Admin Roles & Permissions

-   **Admin**: Access to "Withdrawal Approvals", global statistics, and revenue monitoring.
-   **Merchant**: Access to POS, personal invoices, products, and withdrawal requests.
-   **Security**: Strict data isolation ensures merchants only see their own financial data.

---

## 📄 Financial Reporting & Compliance

-   **Statements**: Generate professional PDF reports with color-coded transaction statuses.
-   **VAT/KRA PIN**: Configurable via settings; automatically reflected on billing documents.
-   **Fee Structure**: Automated deduction of **2.5 KES** service fee on payments and **2%** on withdrawals.

---

## 🆘 Troubleshooting

-   **Prisma Engine Locked**: If `npx prisma generate` fails, ensure the backend process is stopped before running.
-   **Audio Feedback**: Audio cues (beeps) are browser-dependent; users must interact with the page once for audio to be enabled.
-   **PDF Styling**: Reports are optimized for A4 printing; ensure your browser's print settings utilize a "1:1" scale.

