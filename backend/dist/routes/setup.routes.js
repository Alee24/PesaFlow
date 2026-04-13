"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = (0, express_1.Router)();
router.post('/', async (req, res) => {
    console.log("Received Setup Request:", { ...req.body, dbPassword: '***', adminPassword: '***' });
    try {
        const { dbHost, dbPort, dbUser, dbPassword, dbName, mpesaKey, mpesaSecret, mpesaPasskey, mpesaShortcode, mpesaEnv, smtpHost, smtpPort, smtpUser, smtpPassword, smtpSecure, adminEmail, adminPassword } = req.body;
        const encodedPassword = encodeURIComponent(dbPassword);
        const databaseUrl = `mysql://${dbUser}:${encodedPassword}@${dbHost}:${dbPort}/${dbName}`;
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
        const backendDir = path_1.default.join(__dirname, '../../');
        const envPath = path_1.default.join(backendDir, '.env');
        try {
            console.log("Writing .env to:", envPath);
            fs_1.default.writeFileSync(envPath, envContent.trim());
        }
        catch (writeErr) {
            console.error("Failed to write .env:", writeErr);
            return res.status(500).json({ error: 'Permission denied: Cannot write .env file.', details: writeErr.message });
        }
        console.log('Running database setup (npx prisma db push)...');
        const command = process.platform === 'win32' ? 'npx.cmd prisma db push --accept-data-loss' : 'npx prisma db push --accept-data-loss';
        (0, child_process_1.exec)(command, {
            cwd: backendDir,
            env: { ...process.env, DATABASE_URL: databaseUrl },
            timeout: 60000
        }, async (error, stdout, stderr) => {
            if (error) {
                console.error(`DB Setup Failed (Exec Error): ${error.message}`);
                console.error(`Stderr: ${stderr}`);
                return res.json({
                    success: true,
                    warning: true,
                    message: 'Configuration saved! However, automatic database setup failed.',
                    details: 'Please import backend/database_schema.sql manually into your database.',
                    technical_error: stderr || error.message
                });
            }
            console.log(`DB Setup Output: ${stdout}`);
            try {
                const prisma = new client_1.PrismaClient({
                    datasources: { db: { url: databaseUrl } }
                });
                if (adminEmail && adminPassword) {
                    console.log("Creating Admin User:", adminEmail);
                    const hashedPassword = await bcryptjs_1.default.hash(adminPassword, 10);
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
            }
            catch (err) {
                console.error("Admin Creation Error:", err);
                return res.json({
                    success: true,
                    warning: true,
                    message: 'Database initialized, but failed to create Admin user.',
                    details: err.message
                });
            }
        });
    }
    catch (error) {
        console.error('Setup Route Unexpected Error:', error);
        res.status(500).json({ error: 'Internal Server Error during setup', details: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=setup.routes.js.map
