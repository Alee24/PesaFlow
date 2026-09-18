"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestSMS = exports.sendTestEmail = exports.updateSettings = exports.getSettings = exports.getPublicSettings = void 0;
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
        const adminUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
            include: { businessProfile: true }
        });
        res.json({
            serviceChargeEnabled: settings.serviceChargeEnabled,
            serviceChargeAmount: settings.serviceChargeAmount,
            googleAnalyticsId: settings.googleAnalyticsId,
            logoUrl: adminUser?.businessProfile?.logoUrl || null,
            faviconUrl: adminUser?.businessProfile?.faviconUrl || null
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
        const { serviceChargeEnabled, serviceChargeAmount, smtpHost, smtpPort, smtpUser, smtpPass, smtpFromName, smtpFromEmail, googleAnalyticsId, emailNotificationsEnabled, smsNotificationsEnabled, adminNotificationEmail, adminNotificationPhone, advantaPartnerId, advantaApiKey, advantaShortcode, notifyAdminOnRegister, notifyAdminOnPayment, notifyAdminOnWithdrawal } = req.body;
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
        if (emailNotificationsEnabled !== undefined)
            updateData.emailNotificationsEnabled = Boolean(emailNotificationsEnabled);
        if (smsNotificationsEnabled !== undefined)
            updateData.smsNotificationsEnabled = Boolean(smsNotificationsEnabled);
        if (adminNotificationEmail !== undefined)
            updateData.adminNotificationEmail = adminNotificationEmail || null;
        if (adminNotificationPhone !== undefined)
            updateData.adminNotificationPhone = adminNotificationPhone || null;
        if (advantaPartnerId !== undefined)
            updateData.advantaPartnerId = advantaPartnerId || null;
        if (advantaApiKey !== undefined)
            updateData.advantaApiKey = advantaApiKey || null;
        if (advantaShortcode !== undefined)
            updateData.advantaShortcode = advantaShortcode || null;
        if (notifyAdminOnRegister !== undefined)
            updateData.notifyAdminOnRegister = Boolean(notifyAdminOnRegister);
        if (notifyAdminOnPayment !== undefined)
            updateData.notifyAdminOnPayment = Boolean(notifyAdminOnPayment);
        if (notifyAdminOnWithdrawal !== undefined)
            updateData.notifyAdminOnWithdrawal = Boolean(notifyAdminOnWithdrawal);
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
const sendTestSMS = async (req, res) => {
    try {
        const { testPhone, partnerId, apiKey, shortcode } = req.body;
        if (!testPhone) {
            return res.status(400).json({ error: 'Valid phone number is required' });
        }
        const { sendAdvantaSMS } = await Promise.resolve().then(() => __importStar(require('../services/sms.service')));
        const result = await sendAdvantaSMS(testPhone, `[Mpesa Connect Admin] Test SMS: Advanta SMS gateway is operational and verified!`, { partnerId, apiKey, shortcode });
        if (result.success) {
            res.json({ message: `Test SMS dispatched successfully to ${testPhone}!`, data: result.data });
        }
        else {
            res.status(400).json({ error: result.error || 'Failed to dispatch test SMS. Please verify credentials.' });
        }
    }
    catch (error) {
        console.error('Test SMS error:', error);
        res.status(500).json({ error: 'Failed to send test SMS', details: error.message });
    }
};
exports.sendTestSMS = sendTestSMS;
//# sourceMappingURL=settings.controller.js.map