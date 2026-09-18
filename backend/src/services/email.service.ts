
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sendEmail = async (userId: string, to: string, subject: string, html: string, attachments?: any[]) => {
    try {
        let transportConfig: any = null;
        let fromName = 'Mpesa Connect';
        let fromEmail = 'noreply@mpesaconnect.co.ke';

        // Use global SMTP settings configured by Super Admin
        const globalSettings = await prisma.systemSettings.findFirst();

        if (globalSettings?.smtpHost && globalSettings?.smtpUser && globalSettings?.smtpPass) {
            console.log('Using global SMTP settings');
            transportConfig = {
                host: globalSettings.smtpHost,
                port: globalSettings.smtpPort || 587,
                secure: globalSettings.smtpPort === 465,
                auth: {
                    user: globalSettings.smtpUser,
                    pass: globalSettings.smtpPass,
                },
            };
            fromName = globalSettings.smtpFromName || 'Mpesa Connect';
            fromEmail = globalSettings.smtpFromEmail || globalSettings.smtpUser;
        } else {
            // Fallback to environment variables
            console.log('Using environment SMTP settings');
            transportConfig = {
                host: process.env.SMTP_HOST || 'mail.mpesaconnect.co.ke',
                port: Number(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
                auth: {
                    user: process.env.SMTP_USER || 'system@mpesaconnect.co.ke',
                    pass: process.env.SMTP_PASS || '',
                },
            };
            fromEmail = process.env.SMTP_USER || 'system@mpesaconnect.co.ke';
        }

        if (!transportConfig) {
            console.log('No SMTP configuration available');
            return;
        }

        const transporter = nodemailer.createTransport(transportConfig);

        const info = await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to,
            subject,
            html,
            attachments
        });

        console.log("Message sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
    }
};

// System Email Transporter
const getSystemTransporter = async () => {
    // Try global SMTP settings first
    const globalSettings = await prisma.systemSettings.findFirst();

    if (globalSettings?.smtpHost && globalSettings?.smtpUser && globalSettings?.smtpPass) {
        return nodemailer.createTransport({
            host: globalSettings.smtpHost,
            port: globalSettings.smtpPort || 587,
            secure: globalSettings.smtpPort === 465,
            auth: {
                user: globalSettings.smtpUser,
                pass: globalSettings.smtpPass,
            },
        });
    }

    // Fallback to environment variables
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'mail.mpesaconnect.co.ke',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER || 'system@mpesaconnect.co.ke',
            pass: process.env.SMTP_PASS || '',
        },
    });
};

export const sendVerificationEmail = async (email: string, token: string) => {
    // For local dev, update BASE_URL in .env
    const baseUrl = process.env.BASE_URL || 'https://mpesaconnect.co.ke';
    const verifyUrl = `${baseUrl}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;

    const transporter = await getSystemTransporter();

    // Get from name and email from global settings
    const globalSettings = await prisma.systemSettings.findFirst();
    const fromName = globalSettings?.smtpFromName || 'Mpesa Connect Support';
    const fromEmail = globalSettings?.smtpFromEmail || process.env.SMTP_USER || 'system@mpesaconnect.co.ke';

    try {
        await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: email,
            subject: 'Verify your Mpesa Connect Account',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #4f46e5; text-align: center;">Welcome to Mpesa Connect!</h2>
                <p style="color: #333; font-size: 16px;">Hi there,</p>
                <p style="color: #333; font-size: 16px;">Thank you for creating an account. Please verify your email address to complete your registration and log in.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verifyUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email Address</a>
                </div>
                <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                <p style="color: #666; font-size: 14px; word-break: break-all;">${verifyUrl}</p>
                <p style="color: #999; font-size: 12px; text-align: center; margin-top: 40px;">&copy; ${new Date().getFullYear()} Mpesa Connect. All rights reserved.</p>
            </div>
            `
        });
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error('Error sending verification email:', error);
    }
}


export const sendSystemEmail = async (to: string, subject: string, html: string) => {
    const transporter = await getSystemTransporter();

    // Get from name and email from global settings
    const globalSettings = await prisma.systemSettings.findFirst();
    const fromName = globalSettings?.smtpFromName || 'Mpesa Connect Support';
    const fromEmail = globalSettings?.smtpFromEmail || process.env.SMTP_USER || 'system@mpesaconnect.co.ke';

    try {
        await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to,
            subject,
            html
        });
        console.log(`System email sent to ${to}`);
    } catch (error) {
        console.error('Error sending system email:', error);
    }
};
