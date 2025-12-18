import app from './app';
import dotenv from 'dotenv';
import { scheduleDailySalesSummary } from './services/scheduler.service';

dotenv.config();

const PORT = process.env.PORT || 3001;

// Start Cron Jobs
scheduleDailySalesSummary();

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
    console.error('Server failed to start:', err);
});
