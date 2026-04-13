"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSmtpConnection = exports.updateProfile = exports.getProfile = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const profileSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(1, "Company Name is required"),
    logoUrl: zod_1.z.string().optional().or(zod_1.z.literal('')),
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
    mpesaCallbackUrl: zod_1.z.string().optional().or(zod_1.z.literal('')),
    currency: zod_1.z.string().optional().or(zod_1.z.literal('')),
    vatEnabled: zod_1.z.boolean().optional().or(zod_1.z.string().transform(val => val === 'true')),
    vatRate: zod_1.z.number().optional().or(zod_1.z.string().transform(val => parseFloat(val))),
    useCustomMpesa: zod_1.z.boolean().optional().or(zod_1.z.string().transform(val => val === 'true')),
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
        if (req.file) {
            rawData.logoUrl = `/uploads/${req.file.filename}`;
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
            return res.status(400).json({ error: error.errors[0].message });
        }
        res.status(500).json({ error: 'Failed to update profile' });
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
//# sourceMappingURL=profile.controller.js.map
