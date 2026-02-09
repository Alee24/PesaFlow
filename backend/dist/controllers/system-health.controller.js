"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixInvoiceStats = exports.testEmailSending = exports.testMpesaSTK = exports.getSystemHealth = void 0;
const client_1 = require("@prisma/client");
const email_service_1 = require("../services/email.service");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
const getSystemHealth = async (req, res) => {
    const checks = [];
    let overallStatus = 'healthy';
    try {
        try {
            await prisma.$queryRaw `SELECT 1`;
            const userCount = await prisma.user.count();
            checks.push({
                name: 'Database Connection',
                status: 'pass',
                message: 'Database is connected and responsive',
                details: { userCount }
            });
        }
        catch (error) {
            checks.push({
                name: 'Database Connection',
                status: 'fail',
                message: 'Database connection failed',
                details: { error: error.message }
            });
            overallStatus = 'critical';
        }
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
        }
        else {
            checks.push({
                name: 'Environment Variables',
                status: 'fail',
                message: 'Missing required environment variables',
                details: { missing: missingEnvVars }
            });
            overallStatus = 'critical';
        }
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
            }
            else {
                checks.push({
                    name: 'M-Pesa Configuration',
                    status: 'warning',
                    message: 'M-Pesa credentials incomplete',
                    details: mpesaConfig
                });
                if (overallStatus === 'healthy')
                    overallStatus = 'degraded';
            }
        }
        catch (error) {
            checks.push({
                name: 'M-Pesa Configuration',
                status: 'fail',
                message: 'M-Pesa configuration check failed',
                details: { error: error.message }
            });
            if (overallStatus === 'healthy')
                overallStatus = 'degraded';
        }
        try {
            const smtpConfigured = !!(process.env.SMTP_HOST &&
                process.env.SMTP_PORT &&
                process.env.SMTP_USER &&
                process.env.SMTP_PASS);
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
            }
            else {
                checks.push({
                    name: 'SMTP Configuration',
                    status: 'warning',
                    message: 'SMTP not fully configured',
                    details: { note: 'Email features may not work' }
                });
                if (overallStatus === 'healthy')
                    overallStatus = 'degraded';
            }
        }
        catch (error) {
            checks.push({
                name: 'SMTP Configuration',
                status: 'warning',
                message: 'SMTP check failed',
                details: { error: error.message }
            });
        }
        try {
            const uploadDir = path_1.default.join(process.cwd(), 'public', 'uploads');
            if (!fs_1.default.existsSync(uploadDir)) {
                fs_1.default.mkdirSync(uploadDir, { recursive: true });
            }
            const testFile = path_1.default.join(uploadDir, '.health-check');
            fs_1.default.writeFileSync(testFile, 'test');
            fs_1.default.unlinkSync(testFile);
            checks.push({
                name: 'File Upload Permissions',
                status: 'pass',
                message: 'Upload directory is writable',
                details: { path: uploadDir }
            });
        }
        catch (error) {
            checks.push({
                name: 'File Upload Permissions',
                status: 'fail',
                message: 'Upload directory is not writable',
                details: { error: error.message }
            });
            overallStatus = 'critical';
        }
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
            }
            else {
                checks.push({
                    name: 'System Settings',
                    status: 'warning',
                    message: 'No system settings found',
                    details: { note: 'Create system settings in admin panel' }
                });
                if (overallStatus === 'healthy')
                    overallStatus = 'degraded';
            }
        }
        catch (error) {
            checks.push({
                name: 'System Settings',
                status: 'warning',
                message: 'System settings check failed',
                details: { error: error.message }
            });
        }
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
            }
            else {
                checks.push({
                    name: 'Admin Users',
                    status: 'fail',
                    message: 'No admin users found',
                    details: { note: 'Run seed-admin.ts to create admin user' }
                });
                overallStatus = 'critical';
            }
        }
        catch (error) {
            checks.push({
                name: 'Admin Users',
                status: 'fail',
                message: 'Admin user check failed',
                details: { error: error.message }
            });
        }
        const expectedPort = process.env.PORT || '3001';
        checks.push({
            name: 'Port Configuration',
            status: 'pass',
            message: `Server running on port ${expectedPort}`,
            details: { port: expectedPort, env: process.env.NODE_ENV }
        });
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
    }
    catch (error) {
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
exports.getSystemHealth = getSystemHealth;
const testMpesaSTK = async (req, res) => {
    try {
        const { phoneNumber, amount } = req.body;
        if (!phoneNumber || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and amount are required'
            });
        }
        const hasCredentials = !!(process.env.MPESA_CONSUMER_KEY &&
            process.env.MPESA_CONSUMER_SECRET &&
            process.env.MPESA_PASSKEY &&
            process.env.MPESA_SHORTCODE);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'M-Pesa test failed',
            error: error.message
        });
    }
};
exports.testMpesaSTK = testMpesaSTK;
const testEmailSending = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email address is required'
            });
        }
        await (0, email_service_1.sendSystemEmail)(email, 'System Health Check - Test Email', `<h1>Test Email</h1><p>This is a test email from Mpesa Connect system health check.</p><p>If you received this, your email configuration is working correctly!</p>`);
        res.json({
            success: true,
            message: `Test email sent to ${email}`
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Email test failed',
            error: error.message
        });
    }
};
exports.testEmailSending = testEmailSending;
const fixInvoiceStats = async (req, res) => {
    try {
        console.log('Running Invoice Stats Fix...');
        const results = [];
        const paidInvoices = await prisma.transaction.findMany({
            where: {
                type: 'INVOICE',
                status: { in: ['COMPLETED', 'PAID'] }
            }
        });
        for (const invoice of paidInvoices) {
            const sale = await prisma.sale.findUnique({
                where: { transactionId: invoice.id }
            });
            if (sale && sale.paymentStatus !== 'PAID') {
                await prisma.sale.update({
                    where: { id: sale.id },
                    data: {
                        paymentStatus: 'PAID',
                        amountPaid: invoice.amount,
                        amountDue: 0
                    }
                });
                results.push(`Fixed Sale ${sale.id} for Invoice ${invoice.reference}`);
            }
        }
        const stkPayments = await prisma.transaction.findMany({
            where: {
                type: 'DEPOSIT_STK',
                status: 'COMPLETED'
            }
        });
        for (const payment of stkPayments) {
            if (payment.metadata) {
                try {
                    const meta = typeof payment.metadata === 'string'
                        ? JSON.parse(payment.metadata)
                        : payment.metadata;
                    if (meta.invoiceId) {
                        const originalInvoiceTx = await prisma.transaction.findUnique({
                            where: { id: meta.invoiceId }
                        });
                        if (originalInvoiceTx) {
                            if (originalInvoiceTx.status !== 'COMPLETED') {
                                await prisma.transaction.update({
                                    where: { id: originalInvoiceTx.id },
                                    data: { status: 'COMPLETED' }
                                });
                                results.push(`Marked Invoice Transaction ${originalInvoiceTx.id} as COMPLETED`);
                            }
                            const originalSale = await prisma.sale.findUnique({
                                where: { transactionId: originalInvoiceTx.id }
                            });
                            if (originalSale && originalSale.paymentStatus !== 'PAID') {
                                await prisma.sale.update({
                                    where: { id: originalSale.id },
                                    data: {
                                        paymentStatus: 'PAID',
                                        amountPaid: originalSale.totalAmount,
                                        amountDue: 0
                                    }
                                });
                                results.push(`Marked Invoice Sale ${originalSale.id} as PAID`);
                            }
                        }
                    }
                }
                catch (e) {
                }
            }
        }
        console.log('Recalculating Customer LTV...');
        const customerStats = await prisma.sale.groupBy({
            by: ['customerId'],
            where: {
                paymentStatus: 'PAID',
                customerId: { not: null }
            },
            _sum: {
                totalAmount: true
            },
            _count: {
                id: true
            },
            _max: {
                createdAt: true
            }
        });
        for (const stat of customerStats) {
            if (stat.customerId) {
                await prisma.customer.update({
                    where: { id: stat.customerId },
                    data: {
                        lifetimeValue: stat._sum.totalAmount || 0,
                        totalPurchases: stat._count.id,
                        lastPurchaseDate: stat._max.createdAt || undefined
                    }
                });
                results.push(`Updated Customer ${stat.customerId} stats: LTV ${stat._sum.totalAmount}`);
            }
        }
        res.json({
            success: true,
            message: 'Invoice consistency fix and LTV recalculation completed',
            fixedItems: results
        });
    }
    catch (error) {
        console.error('Fix stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Fix failed',
            error: error.message
        });
    }
};
exports.fixInvoiceStats = fixInvoiceStats;
//# sourceMappingURL=system-health.controller.js.map