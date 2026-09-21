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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSMSConnection = exports.testSmtpConnection = exports.updateProfile = exports.getProfile = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const daraja_security_1 = require("../utils/daraja-security");
const prisma = new client_1.PrismaClient();
const profileSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(1, "Company Name is required"),
    logoUrl: zod_1.z.string().optional().or(zod_1.z.literal('')),
    faviconUrl: zod_1.z.string().optional().or(zod_1.z.literal('')),
    contactPhone: zod_1.z.string().optional().or(zod_1.z.literal('')),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    location: zod_1.z.string().optional().or(zod_1.z.literal('')),
    website: zod_1.z.string().optional().or(zod_1.z.literal('')),
    kraPinNumber: zod_1.z.string().optional().or(zod_1.z.literal('')),
    bankDetails: zod_1.z.string().optional().or(zod_1.z.literal('')),
    mpesaDetails: zod_1.z.string().optional().or(zod_1.z.literal('')),
    smtpHost: zod_1.z.string().optional().or(zod_1.z.literal('')),
    smtpPort: zod_1.z.string().or(zod_1.z.number()).transform(val => Number(val)).optional(),
    smtpUser: zod_1.z.string().optional().or(zod_1.z.literal('')),
    smtpPass: zod_1.z.string().optional().or(zod_1.z.literal('')),
    mpesaConsumerKey: zod_1.z.string().optional().or(zod_1.z.literal('')),
    mpesaConsumerSecret: zod_1.z.string().optional().or(zod_1.z.literal('')),
    mpesaPasskey: zod_1.z.string().optional().or(zod_1.z.literal('')),
    mpesaShortcode: zod_1.z.string().optional().or(zod_1.z.literal('')),
    mpesaInitiatorName: zod_1.z.string().optional().or(zod_1.z.literal('')),
    mpesaInitiatorPass: zod_1.z.string().optional().or(zod_1.z.literal('')),
    mpesaSecurityCredential: zod_1.z.string().optional().or(zod_1.z.literal('')),
    mpesaCertificate: zod_1.z.string().optional().or(zod_1.z.literal('')),
    mpesaCallbackUrl: zod_1.z.string().optional().or(zod_1.z.literal('')),
    mpesaEnv: zod_1.z.string().optional().or(zod_1.z.literal('')),
    currency: zod_1.z.string().optional().or(zod_1.z.literal('')),
    vatEnabled: zod_1.z.boolean().optional().or(zod_1.z.string().transform(val => val === 'true')),
    vatRate: zod_1.z.number().optional().or(zod_1.z.string().transform(val => parseFloat(val))),
    useCustomMpesa: zod_1.z.boolean().optional().or(zod_1.z.string().transform(val => val === 'true')),
    onboardingCompleted: zod_1.z.boolean().optional().or(zod_1.z.string().transform(val => val === 'true')),
    emailNotificationsEnabled: zod_1.z.boolean().optional().or(zod_1.z.string().transform(val => val === 'true')),
    smsNotificationsEnabled: zod_1.z.boolean().optional().or(zod_1.z.string().transform(val => val === 'true')),
    smsPartnerId: zod_1.z.string().optional().or(zod_1.z.literal('')),
    smsApiKey: zod_1.z.string().optional().or(zod_1.z.literal('')),
    smsShortcode: zod_1.z.string().optional().or(zod_1.z.literal('')),
    notifyOnSale: zod_1.z.boolean().optional().or(zod_1.z.string().transform(val => val === 'true')),
    notifyOnMpesa: zod_1.z.boolean().optional().or(zod_1.z.string().transform(val => val === 'true')),
    notifyOnInvoice: zod_1.z.boolean().optional().or(zod_1.z.string().transform(val => val === 'true')),
    notifyOnLowStock: zod_1.z.boolean().optional().or(zod_1.z.string().transform(val => val === 'true')),
});
const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const merchantId = req.user.merchantId;
        const profileUserId = merchantId;
        const profile = await prisma.businessProfile.findUnique({
            where: { userId: profileUserId },
        });
        res.json(profile || {});
    }
    catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        let rawData = { ...req.body };
        if (rawData.vatEnabled === 'true')
            rawData.vatEnabled = true;
        if (rawData.vatEnabled === 'false')
            rawData.vatEnabled = false;
        if (rawData.useCustomMpesa === 'true')
            rawData.useCustomMpesa = true;
        if (rawData.useCustomMpesa === 'false')
            rawData.useCustomMpesa = false;
        if (rawData.onboardingCompleted === 'true')
            rawData.onboardingCompleted = true;
        if (rawData.onboardingCompleted === 'false')
            rawData.onboardingCompleted = false;
        if (req.files) {
            const files = req.files;
            if (files['logo'] && files['logo'][0]) {
                rawData.logoUrl = `/uploads/${files['logo'][0].filename}`;
            }
            if (files['favicon'] && files['favicon'][0]) {
                rawData.faviconUrl = `/uploads/${files['favicon'][0].filename}`;
            }
        }
        else if (req.file) {
            if (req.file.fieldname === 'logo') {
                rawData.logoUrl = `/uploads/${req.file.filename}`;
            }
            else if (req.file.fieldname === 'favicon') {
                rawData.faviconUrl = `/uploads/${req.file.filename}`;
            }
        }
        if (rawData.smtpPort) {
            if (typeof rawData.smtpPort === 'string') {
                if (rawData.smtpPort.trim() === '') {
                    delete rawData.smtpPort;
                }
                else {
                    const parsed = parseInt(rawData.smtpPort, 10);
                    if (!isNaN(parsed)) {
                        rawData.smtpPort = parsed;
                    }
                }
            }
        }
        else {
            if (rawData.smtpPort === '')
                delete rawData.smtpPort;
        }
        const existingProfile = await prisma.businessProfile.findUnique({ where: { userId } });
        if ((!rawData.companyName || (typeof rawData.companyName === 'string' && rawData.companyName.trim() === '')) && existingProfile?.companyName) {
            rawData.companyName = existingProfile.companyName;
        }
        if (rawData.mpesaInitiatorPass && typeof rawData.mpesaInitiatorPass === 'string') {
            const cleanPass = rawData.mpesaInitiatorPass.trim();
            if ((0, daraja_security_1.isPrecomputedSecurityCredential)(cleanPass)) {
                rawData.mpesaInitiatorPass = cleanPass;
                if (!rawData.mpesaSecurityCredential || (typeof rawData.mpesaSecurityCredential === 'string' && rawData.mpesaSecurityCredential.trim() === '')) {
                    rawData.mpesaSecurityCredential = cleanPass;
                }
            }
        }
        if (rawData.mpesaSecurityCredential && typeof rawData.mpesaSecurityCredential === 'string') {
            const cleanCred = rawData.mpesaSecurityCredential.trim();
            if ((0, daraja_security_1.isPrecomputedSecurityCredential)(cleanCred)) {
                rawData.mpesaSecurityCredential = cleanCred;
            }
        }
        const data = profileSchema.parse(rawData);
        const profile = await prisma.businessProfile.upsert({
            where: { userId },
            update: data,
            create: { ...data, userId },
        });
        res.json(profile);
    }
    catch (error) {
        console.error("Update Profile Error:", error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
        }
        res.status(500).json({
            error: error.message || 'Failed to update profile. Please verify your credentials format.'
        });
    }
};
exports.updateProfile = updateProfile;
const testSmtpConnection = async (req, res) => {
    try {
        const userId = req.user.userId;
        const profile = await prisma.businessProfile.findUnique({ where: { userId } });
        if (!profile || !profile.smtpHost || !profile.smtpUser || !profile.smtpPass) {
            return res.status(400).json({ message: 'SMTP settings are incomplete/not saved.' });
        }
        const transporter = nodemailer_1.default.createTransport({
            host: profile.smtpHost,
            port: profile.smtpPort || 587,
            secure: profile.smtpPort === 465,
            auth: {
                user: profile.smtpUser,
                pass: profile.smtpPass,
            },
        });
        await transporter.verify();
        const { toEmail } = req.body;
        if (toEmail) {
            await transporter.sendMail({
                from: `"${profile.companyName}" <${profile.smtpUser}>`,
                to: toEmail,
                subject: 'Test Email from Mpesa Connect',
                text: 'This is a test email to confirm your SMTP settings are working correctly.',
                html: '<p>This is a <b>test email</b> to confirm your SMTP settings are working correctly.</p>'
            });
            return res.json({ message: `Connection Successful! Test email sent to ${toEmail}` });
        }
        res.json({ message: 'SMTP Connection Successful!' });
    }
    catch (error) {
        console.error("SMTP Test Error:", error);
        res.status(400).json({ message: 'Connection failed: ' + error.message });
    }
};
exports.testSmtpConnection = testSmtpConnection;
const testSMSConnection = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { toPhone, partnerId, apiKey, shortcode } = req.body;
        const profile = await prisma.businessProfile.findUnique({ where: { userId } });
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const phone = toPhone || profile?.contactPhone || user?.phoneNumber;
        if (!phone) {
            return res.status(400).json({ message: 'Please provide a valid recipient phone number to send test SMS.' });
        }
        const { sendAdvantaSMS } = await Promise.resolve().then(() => __importStar(require('../services/sms.service')));
        const config = {
            partnerId: partnerId || profile?.smsPartnerId,
            apiKey: apiKey || profile?.smsApiKey,
            shortcode: shortcode || profile?.smsShortcode,
        };
        const result = await sendAdvantaSMS(phone, `[Mpesa Connect] Configuration Test: Your SMS alerts are active and working smoothly.`, config);
        if (result.success) {
            return res.json({ message: `Test SMS dispatched successfully to ${phone}!`, data: result.data });
        }
        else {
            return res.status(400).json({ message: result.error || 'Failed to dispatch test SMS. Verify your Advanta credentials.' });
        }
    }
    catch (error) {
        console.error('Test SMS Error:', error);
        res.status(500).json({ message: error.message || 'Failed to test SMS' });
    }
};
exports.testSMSConnection = testSMSConnection;
//# sourceMappingURL=profile.controller.js.map