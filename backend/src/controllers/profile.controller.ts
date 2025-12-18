import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const profileSchema = z.object({
    companyName: z.string().min(1, "Company Name is required"),
    logoUrl: z.string().optional().or(z.literal('')),
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
    mpesaCallbackUrl: z.string().optional().or(z.literal('')),
    currency: z.string().optional().or(z.literal('')),
    vatEnabled: z.boolean().optional().or(z.string().transform(val => val === 'true')),
    vatRate: z.number().optional().or(z.string().transform(val => parseFloat(val))),
});

export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const profile = await prisma.businessProfile.findUnique({
            where: { userId },
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

        // Handle boolean conversion for vatEnabled if it comes as string (multipart/form-data)
        if (rawData.vatEnabled === 'true') rawData.vatEnabled = true;
        if (rawData.vatEnabled === 'false') rawData.vatEnabled = false;

        // Handle file upload
        if (req.file) {
            const protocol = req.protocol;
            const host = req.get('host');
            rawData.logoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
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
            return res.status(400).json({ error: (error as any).errors[0].message });
        }
        res.status(500).json({ error: 'Failed to update profile' });
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
                subject: 'Test Email from PesaFlow',
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
