import app from './app';
import dotenv from 'dotenv';
import { scheduleDailySalesSummary } from './services/scheduler.service';
import walletRoutes from './routes/wallet.routes';
import teamRoutes from './routes/team.routes';

dotenv.config();

const PORT = process.env.PORT || 3001;

// Use routes
app.use('/api/wallet', walletRoutes);
app.use('/api/team', teamRoutes);

// Start Cron Jobs
scheduleDailySalesSummary();

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
    console.error('Server failed to start:', err);
});