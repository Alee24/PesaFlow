import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { scheduleDailySalesSummary } from './services/scheduler.service';
import walletRoutes from './routes/wallet.routes';
import teamRoutes from './routes/team.routes';

const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

// Use routes
app.use('/api/wallet', walletRoutes);
app.use('/api/team', teamRoutes);

// Start Cron Jobs
scheduleDailySalesSummary();

const server = app.listen(PORT, HOST, () => {
    console.log(`Server running on port ${PORT} at host ${HOST}`);
});

server.on('error', (err) => {
    console.error('Server failed to start:', err);
});
