
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

        // ... existing code ...
        // ... existing code ...
        console.log('Running database setup...');

        exec('npx prisma db push', { cwd: backendDir, env: { ...process.env, DATABASE_URL: databaseUrl } }, async (error, stdout, stderr) => {
            if (error) {
                console.error(`DB Setup Error: ${error.message}`);
                // Instead of failing, we return a warning with instructions
                return res.json({
                    success: true, // We consider Saving Config as "Success"
                    warning: true,
                    message: 'Configuration saved! However, we could not automatically create the database tables (likely due to server permissions).',
                    details: 'Please import the "backend/database_schema.sql" file into your MySQL database manually. You can then register your Admin account normally.',
                    technical_error: stderr || error.message
                });
            }

            console.log(`DB Setup Output: ${stdout}`);

            // 6. Create Super Admin User
            try {
                // Initialize Prisma with new connection string
                const prisma = new PrismaClient({
                    datasources: {
                        db: {
                            url: databaseUrl
                        }
                    }
                });

                const { adminEmail, adminPassword } = req.body;
                // ... rest of code same as before ... 
                if (adminEmail && adminPassword) {
                    const bcrypt = require('bcryptjs');
                    const hashedPassword = await bcrypt.hash(adminPassword, 10);

                    await prisma.user.upsert({
                        where: { email: adminEmail },
                        update: {},
                        create: {
                            email: adminEmail,
                            passwordHash: hashedPassword,
                            role: 'ADMIN',
                            name: 'Super Admin',
                            phoneNumber: '0000000000'
                        }
                    });

                    await prisma.$disconnect();
                }

                res.json({
                    success: true,
                    message: 'Configuration saved, database initialized, and admin account created! Please restart the server.'
                });

            } catch (err: any) {
                console.error("Admin Creation Error:", err);
                // Return success mostly because DB is set up
                res.json({
                    success: true,
                    warning: true,
                    message: 'Database initialized but failed to create admin user manually. You may need to register normally.',
                    details: err.message
                });
            }
        });

    } catch (error: any) {
        console.error('Setup failed:', error);
        res.status(500).json({ error: 'Failed to save configuration' });
    }
});

export default router;
