import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { isPrecomputedSecurityCredential } from '../utils/daraja-security';

const prisma = new PrismaClient();

const profileSchema = z.object({
    companyName: z.string().min(1, "Company Name is required"),
    logoUrl: z.string().optional().or(z.literal('')),
    faviconUrl: z.string().optional().or(z.literal('')),
    contactPhone: z.string().optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    location: z.string().optional().or(z.literal('')),
    website: z.string().optional().or(z.literal('')),
    kraPinNumber: z.string().optional().or(z.literal('')),
    bankDetails: z.string().optional().or(z.literal('')),
    mpesaDetails: z.string().optional().or(z.literal('')),
    smtpHost: z.string().optional().or(z.literal('')),
    smtpPort: z.string().or(z.number()).transform(val => Number(val)).optional(),
    smtpUser: z.string().optional().or(z.literal('')),
    smtpPass: z.string().optional().or(z.literal('')),

    // M-Pesa Credentials
    mpesaConsumerKey: z.string().optional().or(z.literal('')),
    mpesaConsumerSecret: z.string().optional().or(z.literal('')),
    mpesaPasskey: z.string().optional().or(z.literal('')),
    mpesaShortcode: z.string().optional().or(z.literal('')),
    mpesaInitiatorName: z.string().optional().or(z.literal('')),
    mpesaInitiatorPass: z.string().optional().or(z.literal('')),
    mpesaSecurityCredential: z.string().optional().or(z.literal('')),
    mpesaCertificate: z.string().optional().or(z.literal('')),
    mpesaCallbackUrl: z.string().optional().or(z.literal('')),
    mpesaEnv: z.string().optional().or(z.literal('')),
    currency: z.string().optional().or(z.literal('')),
    vatEnabled: z.boolean().optional().or(z.string().transform(val => val === 'true')),
    vatRate: z.number().optional().or(z.string().transform(val => parseFloat(val))),
    useCustomMpesa: z.boolean().optional().or(z.string().transform(val => val === 'true')),
    onboardingCompleted: z.boolean().optional().or(z.string().transform(val => val === 'true')),

    // Notification & SMS Configuration
    emailNotificationsEnabled: z.boolean().optional().or(z.string().transform(val => val === 'true')),
    smsNotificationsEnabled: z.boolean().optional().or(z.string().transform(val => val === 'true')),
    smsPartnerId: z.string().optional().or(z.literal('')),
    smsApiKey: z.string().optional().or(z.literal('')),
    smsShortcode: z.string().optional().or(z.literal('')),
    notifyOnSale: z.boolean().optional().or(z.string().transform(val => val === 'true')),
    notifyOnMpesa: z.boolean().optional().or(z.string().transform(val => val === 'true')),
    notifyOnInvoice: z.boolean().optional().or(z.string().transform(val => val === 'true')),
    notifyOnLowStock: z.boolean().optional().or(z.string().transform(val => val === 'true')),
});

export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const merchantId = (req as any).user.merchantId; // For branch managers, this is parent's ID

        // Branch managers use parent merchant's business profile
        const profileUserId = merchantId;

        const profile = await prisma.businessProfile.findUnique({
            where: { userId: profileUserId },
        });

        res.json(profile || {});
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        let rawData = { ...req.body };

        if (rawData.vatEnabled === 'true') rawData.vatEnabled = true;
        if (rawData.vatEnabled === 'false') rawData.vatEnabled = false;
        if (rawData.useCustomMpesa === 'true') rawData.useCustomMpesa = true;
        if (rawData.useCustomMpesa === 'false') rawData.useCustomMpesa = false;
        if (rawData.onboardingCompleted === 'true') rawData.onboardingCompleted = true;
        if (rawData.onboardingCompleted === 'false') rawData.onboardingCompleted = false;

        // Handle file upload
        if (req.files) {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            if (files['logo'] && files['logo'][0]) {
                rawData.logoUrl = `/uploads/${files['logo'][0].filename}`;
            }
            if (files['favicon'] && files['favicon'][0]) {
                rawData.faviconUrl = `/uploads/${files['favicon'][0].filename}`;
            }
        } else if (req.file) {
            // Fallback for single file upload
            if (req.file.fieldname === 'logo') {
                rawData.logoUrl = `/uploads/${req.file.filename}`;
            } else if (req.file.fieldname === 'favicon') {
                rawData.faviconUrl = `/uploads/${req.file.filename}`;
            }
        }

        // Convert SMTP Port to number if string
        if (rawData.smtpPort) {
            if (typeof rawData.smtpPort === 'string') {
                // Check if empty
                if (rawData.smtpPort.trim() === '') {
                    delete rawData.smtpPort;
                } else {
                    const parsed = parseInt(rawData.smtpPort, 10);
                    if (!isNaN(parsed)) {
                        rawData.smtpPort = parsed;
                    }
                }
            }
        } else {
            // If null or undefined
            if (rawData.smtpPort === '') delete rawData.smtpPort;
        }

        // If companyName was not supplied in partial update, fallback to existing profile companyName
        const existingProfile = await prisma.businessProfile.findUnique({ where: { userId } });
        if ((!rawData.companyName || (typeof rawData.companyName === 'string' && rawData.companyName.trim() === '')) && existingProfile?.companyName) {
            rawData.companyName = existingProfile.companyName;
        }

        // Clean & normalize Daraja Initiator credentials
        if (rawData.mpesaInitiatorPass && typeof rawData.mpesaInitiatorPass === 'string') {
            const cleanPass = rawData.mpesaInitiatorPass.trim();
            // If user passed a 160+ char Base64 SecurityCredential into the Initiator Password field
            if (isPrecomputedSecurityCredential(cleanPass)) {
                rawData.mpesaInitiatorPass = cleanPass;
                if (!rawData.mpesaSecurityCredential || (typeof rawData.mpesaSecurityCredential === 'string' && rawData.mpesaSecurityCredential.trim() === '')) {
                    rawData.mpesaSecurityCredential = cleanPass;
                }
            }
        }

        if (rawData.mpesaSecurityCredential && typeof rawData.mpesaSecurityCredential === 'string') {
            const cleanCred = rawData.mpesaSecurityCredential.trim();
            if (isPrecomputedSecurityCredential(cleanCred)) {
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
    } catch (error: any) {
        console.error("Update Profile Error:", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors[0]?.message || 'Validation error' });
        }
        res.status(500).json({ 
            error: error.message || 'Failed to update profile. Please verify your credentials format.' 
        });
    }
};

export const testSmtpConnection = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const profile = await prisma.businessProfile.findUnique({ where: { userId } });

        if (!profile || !profile.smtpHost || !profile.smtpUser || !profile.smtpPass) {
            return res.status(400).json({ message: 'SMTP settings are incomplete/not saved.' });
        }

        const transporter = nodemailer.createTransport({
            host: profile.smtpHost,
            port: profile.smtpPort || 587,
            secure: profile.smtpPort === 465, // True for 465
            auth: {
                user: profile.smtpUser,
                pass: profile.smtpPass,
            },
        });

        await transporter.verify();

        // If toEmail is provided, try sending
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

    } catch (error: any) {
        console.error("SMTP Test Error:", error);
        res.status(400).json({ message: 'Connection failed: ' + error.message });
    }
};

export const testSMSConnection = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { toPhone, partnerId, apiKey, shortcode } = req.body;
        const profile = await prisma.businessProfile.findUnique({ where: { userId } });
        const user = await prisma.user.findUnique({ where: { id: userId } });

        const phone = toPhone || profile?.contactPhone || user?.phoneNumber;
        if (!phone) {
            return res.status(400).json({ message: 'Please provide a valid recipient phone number to send test SMS.' });
        }

        const { sendAdvantaSMS } = await import('../services/sms.service');
        const config = {
            partnerId: partnerId || profile?.smsPartnerId,
            apiKey: apiKey || profile?.smsApiKey,
            shortcode: shortcode || profile?.smsShortcode,
        };

        const result = await sendAdvantaSMS(
            phone,
            `[Mpesa Connect] Configuration Test: Your SMS alerts are active and working smoothly.`,
            config
        );

        if (result.success) {
            return res.json({ message: `Test SMS dispatched successfully to ${phone}!`, data: result.data });
        } else {
            return res.status(400).json({ message: result.error || 'Failed to dispatch test SMS. Verify your Advanta credentials.' });
        }
    } catch (error: any) {
        console.error('Test SMS Error:', error);
        res.status(500).json({ message: error.message || 'Failed to test SMS' });
    }
};
