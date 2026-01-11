import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import mpesaRoutes from './routes/mpesa.routes';
import transactionRoutes from './routes/transaction.routes';
import withdrawalRoutes from './routes/withdrawal.routes';
import profileRoutes from './routes/profile.routes';
import invoiceRoutes from './routes/invoice.routes';
import setupRoutes from './routes/setup.routes';
import adminRoutes from './routes/admin.routes';
import teamRoutes from './routes/team.routes';
import crmRoutes from './routes/crm.routes';
import supportRoutes from './routes/support.routes';
import categoryRoutes from './routes/category.routes';
import notificationRoutes from './routes/notification.routes';

import walletRoutes from './routes/wallet.routes';
import dashboardRoutes from './routes/dashboard.routes';
import salesRoutes from './routes/sales.routes';
import subscriptionRoutes from './routes/subscription.routes';
import analyticsRoutes from './routes/analytics.routes';
import settingsRoutes from './routes/settings.routes';
import adminDashboardRoutes from './routes/admin-dashboard.routes';
import systemHealthRoutes from './routes/system-health.routes';
import licenseRoutes from './routes/license.routes';
import { requireValidLicense } from './middlewares/license.middleware';


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));
// Use process.cwd() to strictly locate 'public/uploads' from the project root (backend/)
// This works in both dev (src/app.ts) and prod (dist/src/app.js) assuming app is started from backend/
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes); // Auth routes are NOT protected by license
app.use('/api/license', licenseRoutes); // License routes are NOT protected by license

// Apply license middleware to ALL routes below this point
app.use(requireValidLicense);

app.use('/api/products', productRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin-dashboard', adminDashboardRoutes);
app.use('/api/system-health', systemHealthRoutes);

app.get('/', (req, res) => {

    res.json({ message: 'M-Pesa SaaS API is running' });
});

export default app;
