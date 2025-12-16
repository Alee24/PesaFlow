import express from 'express';
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


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/setup', setupRoutes);

app.get('/', (req, res) => {

    res.json({ message: 'M-Pesa SaaS API is running' });
});

export default app;
