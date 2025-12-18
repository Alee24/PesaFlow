# 💼 Mpesa Connect - Complete Business Management Platform

**Mpesa Connect** is a comprehensive, production-ready business management platform built for Kenyan businesses. It combines advanced POS capabilities, inventory management, M-Pesa payment integration, and merchant verification into one powerful solution.

---

## ✨ **Key Features**

### 🏪 **Advanced Point of Sale (POS)**
- Real-time inventory updates
- Barcode scanning support
- Flexible discounts (percentage & fixed)
- Split payment methods (Cash + M-Pesa)
- Automatic change calculation
- Customer information capture
- Item-level discounts and taxes
- Receipt generation and printing

### 📦 **Comprehensive Inventory Management**
- Stock level tracking with alerts
- Low stock notifications
- Reorder point automation
- Supplier management
- Batch/lot tracking with expiry dates
- Cost price & profit margin analysis
- Multiple units of measure
- Complete stock movement audit trail
- Barcode support
- Inventory valuation reports

### 💳 **M-Pesa Integration**
- STK Push payments
- Automatic wallet crediting
- Transaction reconciliation
- 2.5 KES service fee
- Real-time payment notifications
- Withdrawal management (2% fee)
- Payment history and tracking

### 📄 **Smart Invoicing**
- Professional invoice creation
- Email notifications
- PDF generation with "Paid" stamps
- Payment tracking (Paid, Pending, Overdue)
- Invoice statistics and filtering
- Customer management

### 🛡️ **Merchant Verification System**
- KYC document upload (ID, Business Permit, KRA Certificate)
- Admin review and approval workflow
- Account status management (PENDING, ACTIVE, REJECTED, SUSPENDED)
- Appeal mechanism for rejected applications
- Role-based access control
- Feature restrictions until activation

### 📊 **Analytics & Reporting**
- Sales statistics and trends
- Inventory valuation
- Profit margin analysis
- Stock movement reports
- Top-selling products
- Payment method breakdown
- Comprehensive dashboards

### 👥 **Multi-User Management**
- Role-based permissions (Admin, Merchant)
- Status-based access control
- User activity tracking
- Secure authentication (JWT)
- Password encryption (bcrypt)

---

## 🛠 Prerequisites

- **Node.js** (v18 or higher)
- **npm** (Node Package Manager)
- **Database**: MySQL (Production) or SQLite (Development)

---

## 📦 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/mpesa-connect.git
cd mpesa-connect
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="mysql://root:password@localhost:3306/mpesaconnect"
JWT_SECRET="your-secret-key-here"

# M-Pesa Configuration
MPESA_CONSUMER_KEY="your-consumer-key"
MPESA_CONSUMER_SECRET="your-consumer-secret"
MPESA_PASSKEY="your-passkey"
MPESA_SHORTCODE="your-shortcode"
MPESA_CALLBACK_URL="https://yourdomain.com/api/mpesa/callback"
MPESA_ENV="sandbox"

# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 3. Database Initialization
Synchronize the schema and generate the client:
```bash
cd backend
npx prisma db push
npx prisma generate
```

---

## ⚡ Running the Application

**Terminal 1: Backend (Port 3001)**
```bash
cd backend
npm run dev
```

**Terminal 2: Frontend (Port 2424)**
```bash
cd frontend
npm run dev
```

Access the application at: **http://localhost:2424**

---

## 🛡️ Merchant Verification & Access Control

### User Status Lifecycle

Mpesa Connect implements a comprehensive verification system to ensure platform security:

**1. PENDING_VERIFICATION** (Default for new merchants)
- Status assigned immediately after registration
- **Allowed Actions:**
  - ✅ POS System (Cash Sales only)
  - ✅ Product Management (Add/Edit/Delete)
  - ✅ View Dashboard & Transactions
  - ✅ Profile Settings
- **Restricted Actions:**
  - ❌ M-Pesa STK Push
  - ❌ Invoice Creation
  - ❌ Withdrawal Requests
- **User Experience:** Yellow banner notification explaining restrictions

**2. ACTIVE** (After Admin Approval)
- Full platform access granted
- All features unlocked including digital payments and withdrawals

**3. REJECTED** (If KYC Verification Fails)
- Account application denied by admin
- Red banner displays rejection reason
- User can submit an appeal through profile page
- All features disabled except viewing rejection details

**4. SUSPENDED** (Admin Action)
- Temporary account suspension
- All features disabled

### Admin Verification Workflow

Admins access the **Merchant Verification** page to:

1. **Review Applications:** View pending registrations with complete business profiles
2. **Review KYC Documents:** National ID, Business Permit, Registration Certificate, KRA PIN Certificate
3. **Approve:** One-click activation changes status to `ACTIVE`
4. **Reject:** Provide detailed reason stored in `appealNotes` for user feedback

### KYC Document Requirements

During registration, merchants must upload:
- National ID (Front & Back)
- Business Permit
- Certificate of Registration
- KRA PIN Certificate
- Data Policy Acceptance

Documents stored in `backend/public/uploads/` for admin verification.

---

## 🔐 Admin Roles & Permissions

- **Admin**: Merchant verification, withdrawal approvals, global statistics, user management
- **Merchant**: POS, invoices, products, withdrawal requests (after activation)
- **Security**: Strict data isolation ensures merchants only see their own financial data

---

## 📄 Financial Reporting & Compliance

- **Statements**: Generate professional PDF reports with color-coded transaction statuses.
- **VAT/KRA PIN**: Configurable via settings; automatically reflected on billing documents.
- **Fee Structure**: Automated deduction of **2.5 KES** service fee on payments and **2%** on withdrawals.

---

## 🆘 Troubleshooting

- **Prisma Engine Locked**: If `npx prisma generate` fails, ensure the backend process is stopped before running.
- **Audio Feedback**: Audio cues (beeps) are browser-dependent; users must interact with the page once for audio to be enabled.
- **PDF Styling**: Reports are optimized for A4 printing; ensure your browser's print settings utilize a "1:1" scale.
- **File Uploads**: KYC docs are stored in `backend/public/uploads`. Ensure the folder is writable and the backend has permission to save files.
- **MySQL Connection**: Ensure your MySQL server is running and the database specified in `.env` exists before running `npx prisma db push`.

---

## 🚀 Technology Stack

### Backend
- **Node.js** with **Express.js**
- **Prisma ORM** with MySQL
- **JWT** for authentication
- **bcrypt** for password hashing
- **Zod** for validation
- **Multer** for file uploads
- **Nodemailer** for email notifications

### Frontend
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **@react-pdf/renderer** for PDF generation
- **date-fns** for date formatting
- **Lucide React** for icons

---

## 📊 API Endpoints

### Inventory Management
```
GET    /api/products                    - List with filters
GET    /api/products/stats              - Inventory analytics
GET    /api/products/stock-movements    - Movement history
GET    /api/products/:id                - Product details
POST   /api/products                    - Create product
PUT    /api/products/:id                - Update product
DELETE /api/products/:id                - Archive product
POST   /api/products/:id/adjust-stock   - Manual adjustment
```

### Sales/POS
```
POST   /api/sales/cash                  - Create sale
GET    /api/sales/recent                - Recent sales
GET    /api/sales/stats                 - Sales analytics
GET    /api/sales/:id                   - Sale details
```

### M-Pesa
```
POST   /api/mpesa/stk-push              - Initiate payment
POST   /api/mpesa/callback              - M-Pesa callback
POST   /api/mpesa/test                  - Test connection
```

### Invoices
```
POST   /api/invoices                    - Create invoice
GET    /api/invoices                    - List invoices
```

### Withdrawals
```
POST   /api/withdrawals                 - Request withdrawal
GET    /api/withdrawals                 - List withdrawals
GET    /api/withdrawals/all             - All withdrawals (Admin)
POST   /api/withdrawals/:id/approve     - Approve (Admin)
POST   /api/withdrawals/:id/reject      - Reject (Admin)
```

### Admin
```
GET    /api/admin/users                 - List all users
POST   /api/admin/users                 - Create user
PATCH  /api/admin/users/:id/status      - Update status
GET    /api/admin/stats                 - Platform statistics
```

---

## 📝 License

This project is licensed under the MIT License.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Support

For support, email support@mpesaconnect.com or join our Slack channel.

---

**Built with ❤️ in Kenya** 🇰🇪