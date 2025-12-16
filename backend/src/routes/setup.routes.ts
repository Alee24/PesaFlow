
import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { PrismaClient } from '@prisma/client';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            dbHost, dbPort, dbUser, dbPassword, dbName,
            mpesaKey, mpesaSecret, mpesaPasskey, mpesaShortcode, mpesaEnv,
            smtpHost, smtpPort, smtpUser, smtpPassword, smtpSecure
        } = req.body;

        // 1. Construct DATABASE_URL
        // Special handling for special characters in password
        const encodedPassword = encodeURIComponent(dbPassword);
        const databaseUrl = `mysql://${dbUser}:${encodedPassword}@${dbHost}:${dbPort}/${dbName}`;

        // 2. Test Database Connection
        // We'll try to connect using a temporary Prisma instance or just assume it works if we can't easily spin one up dynamically.
        // Better: We can try a raw MySQL connection test, but we don't have 'mysql2' driver installed explicitly, prisma uses it internally.
        // For now, trust the user input or allow the 'prisma db push' step to fail if creds are wrong.

        // 3. Prepare .env content
        const envContent = `
# Database Configuration
DATABASE_URL="${databaseUrl}"

# Server Configuration
PORT=3001
JWT_SECRET="created_during_installation_${Date.now()}"

# M-Pesa Configuration
MPESA_CONSUMER_KEY="${mpesaKey}"
MPESA_CONSUMER_SECRET="${mpesaSecret}"
MPESA_PASSKEY="${mpesaPasskey}"
MPESA_SHORTCODE="${mpesaShortcode}"
MPESA_ENV="${mpesaEnv || 'sandbox'}"
MPESA_CALLBACK_URL="http://localhost:3001/api/mpesa/callback"

# SMTP Configuration
SMTP_HOST="${smtpHost}"
SMTP_PORT="${smtpPort}"
SMTP_USER="${smtpUser}"
SMTP_PASS="${smtpPassword}"
SMTP_SECURE="${smtpSecure || 'false'}"
`;

        const envPath = path.join(__dirname, '../../.env');

        // 4. Write .env file
        fs.writeFileSync(envPath, envContent.trim());

        // 5. Run Database Migration (Prisma Push)
        // This initializes the DB with tables
        // We need to run this command in the backend directory
        const backendDir = path.join(__dirname, '../../');

        console.log('Running database setup...');

        exec('npx prisma db push', { cwd: backendDir, env: { ...process.env, DATABASE_URL: databaseUrl } }, (error, stdout, stderr) => {
            if (error) {
                console.error(`DB Setup Error: ${error.message}`);
                return res.status(500).json({
                    error: 'Saved configuration but failed to initialize database. Please check credentials.',
                    details: stderr || error.message
                });
            }

            console.log(`DB Setup Output: ${stdout}`);

            res.json({
                success: true,
                message: 'Configuration saved and database initialized! Please restart the server to apply changes.'
            });
        });

    } catch (error: any) {
        console.error('Setup failed:', error);
        res.status(500).json({ error: 'Failed to save configuration' });
    }
});

export default router;
