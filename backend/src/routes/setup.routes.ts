
import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
    console.log("Received Setup Request:", { ...req.body, dbPassword: '***', adminPassword: '***' });

    try {
        const {
            dbHost, dbPort, dbUser, dbPassword, dbName,
            mpesaKey, mpesaSecret, mpesaPasskey, mpesaShortcode, mpesaEnv,
            smtpHost, smtpPort, smtpUser, smtpPassword, smtpSecure,
            adminEmail, adminPassword
        } = req.body;

        // 1. Construct DATABASE_URL
        const encodedPassword = encodeURIComponent(dbPassword);
        const databaseUrl = `mysql://${dbUser}:${encodedPassword}@${dbHost}:${dbPort}/${dbName}`;

        // 2. Prepare .env content
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

        const backendDir = path.join(__dirname, '../../');
        const envPath = path.join(backendDir, '.env');

        // 3. Write .env file
        try {
            console.log("Writing .env to:", envPath);
            fs.writeFileSync(envPath, envContent.trim());
        } catch (writeErr: any) {
            console.error("Failed to write .env:", writeErr);
            return res.status(500).json({ error: 'Permission denied: Cannot write .env file.', details: writeErr.message });
        }

        // 4. Run Database Migration (Prisma Push)
        console.log('Running database setup (npx prisma db push)...');
        // We use --accept-data-loss to ensure it doesn't hang on prompts
        // We set the timeout to 60s
        const command = process.platform === 'win32' ? 'npx.cmd prisma db push --accept-data-loss' : 'npx prisma db push --accept-data-loss';

        exec(command, {
            cwd: backendDir,
            env: { ...process.env, DATABASE_URL: databaseUrl },
            timeout: 60000
        }, async (error, stdout, stderr) => {

            if (error) {
                console.error(`DB Setup Failed (Exec Error): ${error.message}`);
                console.error(`Stderr: ${stderr}`);

                // Return Warning Response instead of Error
                return res.json({
                    success: true, // Frontend treats this as success
                    warning: true,
                    message: 'Configuration saved! However, automatic database setup failed.',
                    details: 'Please import backend/database_schema.sql manually into your database.',
                    technical_error: stderr || error.message
                });
            }

            console.log(`DB Setup Output: ${stdout}`);

            // 5. Create Super Admin User
            try {
                // Initialize Prisma with new connection string specifically for this operation
                const prisma = new PrismaClient({
                    datasources: { db: { url: databaseUrl } }
                });

                if (adminEmail && adminPassword) {
                    console.log("Creating Admin User:", adminEmail);
                    const hashedPassword = await bcrypt.hash(adminPassword, 10);

                    await prisma.user.upsert({
                        where: { email: adminEmail },
                        update: {},
                        create: {
                            email: adminEmail,
                            passwordHash: hashedPassword,
                            role: 'ADMIN',
                            name: 'Super Admin',
                            phoneNumber: '0000000000',
                            wallet: { create: { balance: 0 } },
                            businessProfile: { create: { companyName: 'System Admin' } }
                        }
                    });

                    await prisma.$disconnect();
                    console.log("Admin User Created Successfully");
                }

                return res.json({
                    success: true,
                    message: 'Installation completed successfully! Please restart the backend server.'
                });

            } catch (err: any) {
                console.error("Admin Creation Error:", err);
                return res.json({
                    success: true,
                    warning: true,
                    message: 'Database initialized, but failed to create Admin user.',
                    details: err.message
                });
            }
        });

    } catch (error: any) {
        console.error('Setup Route Unexpected Error:', error);
        res.status(500).json({ error: 'Internal Server Error during setup', details: error.message });
    }
});

export default router;
