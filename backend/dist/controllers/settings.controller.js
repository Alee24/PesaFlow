"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestEmail = exports.updateSettings = exports.getSettings = exports.getPublicSettings = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getPublicSettings = async (req, res) => {
    try {
        let settings = await prisma.systemSettings.findFirst();
        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    serviceChargeEnabled: true,
                    serviceChargeAmount: 2.5
                }
            });
        }
        res.json({
            serviceChargeEnabled: settings.serviceChargeEnabled,
            serviceChargeAmount: settings.serviceChargeAmount,
            googleAnalyticsId: settings.googleAnalyticsId
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getPublicSettings = getPublicSettings;
const getSettings = async (req, res) => {
    try {
        let settings = await prisma.systemSettings.findFirst();
        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    serviceChargeEnabled: true,
                    serviceChargeAmount: 2.5
                }
            });
        }
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    try {
        const { serviceChargeEnabled, serviceChargeAmount, smtpHost, smtpPort, smtpUser, smtpPass, smtpFromName, smtpFromEmail, googleAnalyticsId } = req.body;
        if (serviceChargeEnabled !== undefined && typeof serviceChargeEnabled !== 'boolean') {
            return res.status(400).json({ error: 'serviceChargeEnabled must be a boolean' });
        }
        if (serviceChargeAmount !== undefined && (typeof serviceChargeAmount !== 'number' || serviceChargeAmount < 0)) {
            return res.status(400).json({ error: 'serviceChargeAmount must be a positive number' });
        }
        if (smtpPort !== undefined && (typeof smtpPort !== 'number' || smtpPort < 1 || smtpPort > 65535)) {
            return res.status(400).json({ error: 'smtpPort must be a valid port number (1-65535)' });
        }
        if (smtpFromEmail !== undefined && smtpFromEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smtpFromEmail)) {
            return res.status(400).json({ error: 'smtpFromEmail must be a valid email address' });
        }
        let settings = await prisma.systemSettings.findFirst();
        const updateData = {};
        if (serviceChargeEnabled !== undefined)
            updateData.serviceChargeEnabled = serviceChargeEnabled;
        if (serviceChargeAmount !== undefined)
            updateData.serviceChargeAmount = serviceChargeAmount;
        if (smtpHost !== undefined)
            updateData.smtpHost = smtpHost || null;
        if (smtpPort !== undefined)
            updateData.smtpPort = smtpPort || null;
        if (smtpUser !== undefined)
            updateData.smtpUser = smtpUser || null;
        if (smtpPass !== undefined)
            updateData.smtpPass = smtpPass || null;
        if (smtpFromName !== undefined)
            updateData.smtpFromName = smtpFromName || null;
        if (smtpFromEmail !== undefined)
            updateData.smtpFromEmail = smtpFromEmail || null;
        if (googleAnalyticsId !== undefined)
            updateData.googleAnalyticsId = googleAnalyticsId || null;
        if (settings) {
            settings = await prisma.systemSettings.update({
                where: { id: settings.id },
                data: updateData
            });
        }
        else {
            settings = await prisma.systemSettings.create({
                data: {
                    serviceChargeEnabled: serviceChargeEnabled ?? true,
                    serviceChargeAmount: serviceChargeAmount ?? 2.5,
                    ...updateData
                }
            });
        }
        res.json({ message: 'Settings updated successfully', settings });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateSettings = updateSettings;
const sendTestEmail = async (req, res) => {
    try {
        const { testEmail } = req.body;
        if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
            return res.status(400).json({ error: 'Valid email address is required' });
        }
        const settings = await prisma.systemSettings.findFirst();
        if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPass) {
            return res.status(400).json({ error: 'SMTP settings not configured. Please configure SMTP settings first.' });
        }
        const nodemailer = require('nodemailer');
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
    }
    catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            error: 'Failed to send test email',
            details: error.message
        });
    }
};
exports.sendTestEmail = sendTestEmail;
//# sourceMappingURL=settings.controller.js.map
