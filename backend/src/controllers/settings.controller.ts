import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

// Get system settings (public - for service charge display)
export const getPublicSettings = async (req: Request, res: Response) => {
    try {
        let settings = await prisma.systemSettings.findFirst();

        // Create default settings if none exist
        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    serviceChargeEnabled: true,
                    serviceChargeAmount: 2.5
                }
            });
        }

        // Fetch Super Admin profile for global logo
        const adminUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
            include: { businessProfile: true }
        });

        res.json({
            serviceChargeEnabled: settings.serviceChargeEnabled,
            serviceChargeAmount: settings.serviceChargeAmount,
            googleAnalyticsId: settings.googleAnalyticsId,
            logoUrl: adminUser?.businessProfile?.logoUrl || null
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Get all settings (admin only)
export const getSettings = async (req: AuthRequest, res: Response) => {
    try {
        let settings = await prisma.systemSettings.findFirst();

        // Create default settings if none exist
        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    serviceChargeEnabled: true,
                    serviceChargeAmount: 2.5
                }
            });
        }

        res.json(settings);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Update settings (admin only)
export const updateSettings = async (req: AuthRequest, res: Response) => {
    try {
        const {
            serviceChargeEnabled,
            serviceChargeAmount,
            smtpHost,
            smtpPort,
            smtpUser,
            smtpPass,
            smtpFromName,
            smtpFromEmail,
            googleAnalyticsId,
            emailNotificationsEnabled,
            smsNotificationsEnabled,
            adminNotificationEmail,
            adminNotificationPhone,
            advantaPartnerId,
            advantaApiKey,
            advantaShortcode,
            notifyAdminOnRegister,
            notifyAdminOnPayment,
            notifyAdminOnWithdrawal
        } = req.body;

        // Validate service charge inputs
        if (serviceChargeEnabled !== undefined && typeof serviceChargeEnabled !== 'boolean') {
            return res.status(400).json({ error: 'serviceChargeEnabled must be a boolean' });
        }

        if (serviceChargeAmount !== undefined && (typeof serviceChargeAmount !== 'number' || serviceChargeAmount < 0)) {
            return res.status(400).json({ error: 'serviceChargeAmount must be a positive number' });
        }

        // Validate SMTP inputs
        if (smtpPort !== undefined && (typeof smtpPort !== 'number' || smtpPort < 1 || smtpPort > 65535)) {
            return res.status(400).json({ error: 'smtpPort must be a valid port number (1-65535)' });
        }

        if (smtpFromEmail !== undefined && smtpFromEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smtpFromEmail)) {
            return res.status(400).json({ error: 'smtpFromEmail must be a valid email address' });
        }

        // Get existing settings or create new
        let settings = await prisma.systemSettings.findFirst();

        const updateData: any = {};
        if (serviceChargeEnabled !== undefined) updateData.serviceChargeEnabled = serviceChargeEnabled;
        if (serviceChargeAmount !== undefined) updateData.serviceChargeAmount = serviceChargeAmount;
        if (smtpHost !== undefined) updateData.smtpHost = smtpHost || null;
        if (smtpPort !== undefined) updateData.smtpPort = smtpPort || null;
        if (smtpUser !== undefined) updateData.smtpUser = smtpUser || null;
        if (smtpPass !== undefined) updateData.smtpPass = smtpPass || null;
        if (smtpFromName !== undefined) updateData.smtpFromName = smtpFromName || null;
        if (smtpFromEmail !== undefined) updateData.smtpFromEmail = smtpFromEmail || null;
        if (googleAnalyticsId !== undefined) updateData.googleAnalyticsId = googleAnalyticsId || null;

        // Notification Settings
        if (emailNotificationsEnabled !== undefined) updateData.emailNotificationsEnabled = Boolean(emailNotificationsEnabled);
        if (smsNotificationsEnabled !== undefined) updateData.smsNotificationsEnabled = Boolean(smsNotificationsEnabled);
        if (adminNotificationEmail !== undefined) updateData.adminNotificationEmail = adminNotificationEmail || null;
        if (adminNotificationPhone !== undefined) updateData.adminNotificationPhone = adminNotificationPhone || null;
        if (advantaPartnerId !== undefined) updateData.advantaPartnerId = advantaPartnerId || null;
        if (advantaApiKey !== undefined) updateData.advantaApiKey = advantaApiKey || null;
        if (advantaShortcode !== undefined) updateData.advantaShortcode = advantaShortcode || null;
        if (notifyAdminOnRegister !== undefined) updateData.notifyAdminOnRegister = Boolean(notifyAdminOnRegister);
        if (notifyAdminOnPayment !== undefined) updateData.notifyAdminOnPayment = Boolean(notifyAdminOnPayment);
        if (notifyAdminOnWithdrawal !== undefined) updateData.notifyAdminOnWithdrawal = Boolean(notifyAdminOnWithdrawal);

        if (settings) {
            settings = await prisma.systemSettings.update({
                where: { id: settings.id },
                data: updateData
            });
        } else {
            settings = await prisma.systemSettings.create({
                data: {
                    serviceChargeEnabled: serviceChargeEnabled ?? true,
                    serviceChargeAmount: serviceChargeAmount ?? 2.5,
                    ...updateData
                }
            });
        }

        res.json({ message: 'Settings updated successfully', settings });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Send test email (admin only)
export const sendTestEmail = async (req: AuthRequest, res: Response) => {
    try {
        const { testEmail } = req.body;

        if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
            return res.status(400).json({ error: 'Valid email address is required' });
        }

        // Fetch global SMTP settings
        const settings = await prisma.systemSettings.findFirst();

        if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPass) {
            return res.status(400).json({ error: 'SMTP settings not configured. Please configure SMTP settings first.' });
        }

        // Import nodemailer
        const nodemailer = require('nodemailer');

        // Create transporter with global settings
        const transporter = nodemailer.createTransport({
            host: settings.smtpHost,
            port: settings.smtpPort || 587,
            secure: settings.smtpPort === 465,
            auth: {
                user: settings.smtpUser,
                pass: settings.smtpPass,
            },
        });

        const fromName = settings.smtpFromName || 'Mpesa Connect';
        const fromEmail = settings.smtpFromEmail || settings.smtpUser;

        // Send test email
        await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: testEmail,
            subject: 'Test Email from Mpesa Connect',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #4f46e5; text-align: center;">✅ SMTP Configuration Test</h2>
                    <p style="color: #333; font-size: 16px;">Congratulations!</p>
                    <p style="color: #333; font-size: 16px;">Your SMTP settings are configured correctly and working as expected.</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>SMTP Host:</strong> ${settings.smtpHost}</p>
                        <p style="margin: 5px 0;"><strong>SMTP Port:</strong> ${settings.smtpPort || 587}</p>
                        <p style="margin: 5px 0;"><strong>From Name:</strong> ${fromName}</p>
                        <p style="margin: 5px 0;"><strong>From Email:</strong> ${fromEmail}</p>
                    </div>
                    <p style="color: #666; font-size: 14px;">This is a test email sent from your Mpesa Connect admin portal.</p>
                    <p style="color: #999; font-size: 12px; text-align: center; margin-top: 40px;">&copy; ${new Date().getFullYear()} Mpesa Connect. All rights reserved.</p>
                </div>
            `
        });

        res.json({ message: 'Test email sent successfully!' });
    } catch (error: any) {
        console.error('Test email error:', error);
        res.status(500).json({
            error: 'Failed to send test email',
            details: error.message
        });
    }
};

// Send test SMS (admin only)
export const sendTestSMS = async (req: AuthRequest, res: Response) => {
    try {
        const { testPhone, partnerId, apiKey, shortcode } = req.body;

        if (!testPhone) {
            return res.status(400).json({ error: 'Valid phone number is required' });
        }

        const { sendAdvantaSMS } = await import('../services/sms.service');
        const result = await sendAdvantaSMS(
            testPhone,
            `[Mpesa Connect Admin] Test SMS: Advanta SMS gateway is operational and verified!`,
            { partnerId, apiKey, shortcode }
        );

        if (result.success) {
            res.json({ message: `Test SMS dispatched successfully to ${testPhone}!`, data: result.data });
        } else {
            res.status(400).json({ error: result.error || 'Failed to dispatch test SMS. Please verify credentials.' });
        }
    } catch (error: any) {
        console.error('Test SMS error:', error);
        res.status(500).json({ error: 'Failed to send test SMS', details: error.message });
    }
};
