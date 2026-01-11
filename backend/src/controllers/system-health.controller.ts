import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { sendSystemEmail } from '../services/email.service';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface HealthCheck {
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    details?: any;
}

export const getSystemHealth = async (req: Request, res: Response) => {
    const checks: HealthCheck[] = [];
    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';

    try {
        // 1. Database Connection Check
        try {
            await prisma.$queryRaw`SELECT 1`;
            const userCount = await prisma.user.count();
            checks.push({
                name: 'Database Connection',
                status: 'pass',
                message: 'Database is connected and responsive',
                details: { userCount }
            });
        } catch (error: any) {
            checks.push({
                name: 'Database Connection',
                status: 'fail',
                message: 'Database connection failed',
                details: { error: error.message }
            });
            overallStatus = 'critical';
        }

        // 2. Environment Variables Check
        const requiredEnvVars = [
            'DATABASE_URL',
            'JWT_SECRET',
            'MPESA_CONSUMER_KEY',
            'MPESA_CONSUMER_SECRET',
            'MPESA_PASSKEY',
            'MPESA_SHORTCODE'
        ];

        const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (missingEnvVars.length === 0) {
            checks.push({
                name: 'Environment Variables',
                status: 'pass',
                message: 'All required environment variables are set',
                details: { checked: requiredEnvVars.length }
            });
        } else {
            checks.push({
                name: 'Environment Variables',
                status: 'fail',
                message: 'Missing required environment variables',
                details: { missing: missingEnvVars }
            });
            overallStatus = 'critical';
        }

        // 3. M-Pesa Configuration Check
        try {
            const mpesaConfig = {
                consumerKey: process.env.MPESA_CONSUMER_KEY,
                consumerSecret: process.env.MPESA_CONSUMER_SECRET,
                passkey: process.env.MPESA_PASSKEY,
                shortcode: process.env.MPESA_SHORTCODE
            };

            const allConfigured = Object.values(mpesaConfig).every(val => val && val.length > 0);

            if (allConfigured) {
                checks.push({
                    name: 'M-Pesa Configuration',
                    status: 'pass',
                    message: 'M-Pesa credentials are configured',
                    details: { shortcode: mpesaConfig.shortcode }
                });
            } else {
                checks.push({
                    name: 'M-Pesa Configuration',
                    status: 'warning',
                    message: 'M-Pesa credentials incomplete',
                    details: mpesaConfig
                });
                if (overallStatus === 'healthy') overallStatus = 'degraded';
            }
        } catch (error: any) {
            checks.push({
                name: 'M-Pesa Configuration',
                status: 'fail',
                message: 'M-Pesa configuration check failed',
                details: { error: error.message }
            });
            if (overallStatus === 'healthy') overallStatus = 'degraded';
        }

        // 4. SMTP/Email Configuration Check
        try {
            const smtpConfigured = !!(
                process.env.SMTP_HOST &&
                process.env.SMTP_PORT &&
                process.env.SMTP_USER &&
                process.env.SMTP_PASS
            );

            if (smtpConfigured) {
                checks.push({
                    name: 'SMTP Configuration',
                    status: 'pass',
                    message: 'SMTP credentials are configured',
                    details: {
                        host: process.env.SMTP_HOST,
                        port: process.env.SMTP_PORT,
                        user: process.env.SMTP_USER
                    }
                });
            } else {
                checks.push({
                    name: 'SMTP Configuration',
                    status: 'warning',
                    message: 'SMTP not fully configured',
                    details: { note: 'Email features may not work' }
                });
                if (overallStatus === 'healthy') overallStatus = 'degraded';
            }
        } catch (error: any) {
            checks.push({
                name: 'SMTP Configuration',
                status: 'warning',
                message: 'SMTP check failed',
                details: { error: error.message }
            });
        }

        // 5. File Upload Permissions Check
        try {
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');

            // Check if directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Try to write a test file
            const testFile = path.join(uploadDir, '.health-check');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);

            checks.push({
                name: 'File Upload Permissions',
                status: 'pass',
                message: 'Upload directory is writable',
                details: { path: uploadDir }
            });
        } catch (error: any) {
            checks.push({
                name: 'File Upload Permissions',
                status: 'fail',
                message: 'Upload directory is not writable',
                details: { error: error.message }
            });
            overallStatus = 'critical';
        }

        // 6. System Settings Check
        try {
            const systemSettings = await prisma.systemSettings.findFirst();

            if (systemSettings) {
                checks.push({
                    name: 'System Settings',
                    status: 'pass',
                    message: 'System settings configured',
                    details: {
                        serviceChargeAmount: systemSettings.serviceChargeAmount,
                        hasGlobalSMTP: !!(systemSettings.smtpHost && systemSettings.smtpUser)
                    }
                });
            } else {
                checks.push({
                    name: 'System Settings',
                    status: 'warning',
                    message: 'No system settings found',
                    details: { note: 'Create system settings in admin panel' }
                });
                if (overallStatus === 'healthy') overallStatus = 'degraded';
            }
        } catch (error: any) {
            checks.push({
                name: 'System Settings',
                status: 'warning',
                message: 'System settings check failed',
                details: { error: error.message }
            });
        }

        // 7. Admin User Check
        try {
            const adminCount = await prisma.user.count({
                where: { role: 'ADMIN' }
            });

            if (adminCount > 0) {
                checks.push({
                    name: 'Admin Users',
                    status: 'pass',
                    message: `${adminCount} admin user(s) configured`,
                    details: { count: adminCount }
                });
            } else {
                checks.push({
                    name: 'Admin Users',
                    status: 'fail',
                    message: 'No admin users found',
                    details: { note: 'Run seed-admin.ts to create admin user' }
                });
                overallStatus = 'critical';
            }
        } catch (error: any) {
            checks.push({
                name: 'Admin Users',
                status: 'fail',
                message: 'Admin user check failed',
                details: { error: error.message }
            });
        }

        // 8. Port Configuration Check
        const expectedPort = process.env.PORT || '3001';
        checks.push({
            name: 'Port Configuration',
            status: 'pass',
            message: `Server running on port ${expectedPort}`,
            details: { port: expectedPort, env: process.env.NODE_ENV }
        });

        // Summary
        const summary = {
            overallStatus,
            totalChecks: checks.length,
            passed: checks.filter(c => c.status === 'pass').length,
            warnings: checks.filter(c => c.status === 'warning').length,
            failed: checks.filter(c => c.status === 'fail').length,
            timestamp: new Date().toISOString(),
            readyForProduction: overallStatus === 'healthy'
        };

        res.json({
            summary,
            checks
        });

    } catch (error: any) {
        console.error('System health check error:', error);
        res.status(500).json({
            summary: {
                overallStatus: 'critical',
                error: error.message
            },
            checks
        });
    }
};

// Test M-Pesa STK Push
export const testMpesaSTK = async (req: Request, res: Response) => {
    try {
        const { phoneNumber, amount } = req.body;

        if (!phoneNumber || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and amount are required'
            });
        }

        // This would call your actual STK push function
        // For now, just validate credentials
        const hasCredentials = !!(
            process.env.MPESA_CONSUMER_KEY &&
            process.env.MPESA_CONSUMER_SECRET &&
            process.env.MPESA_PASSKEY &&
            process.env.MPESA_SHORTCODE
        );

        if (!hasCredentials) {
            return res.status(400).json({
                success: false,
                message: 'M-Pesa credentials not configured'
            });
        }

        res.json({
            success: true,
            message: 'M-Pesa credentials validated. STK push would be initiated in production.',
            test: true
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'M-Pesa test failed',
            error: error.message
        });
    }
};

// Test Email Sending
export const testEmailSending = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email address is required'
            });
        }

        await sendSystemEmail(
            email,
            'System Health Check - Test Email',
            `<h1>Test Email</h1><p>This is a test email from Mpesa Connect system health check.</p><p>If you received this, your email configuration is working correctly!</p>`
        );

        res.json({
            success: true,
            message: `Test email sent to ${email}`
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Email test failed',
            error: error.message
        });
    }
};
