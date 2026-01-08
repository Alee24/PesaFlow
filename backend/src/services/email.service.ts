
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sendEmail = async (userId: string, to: string, subject: string, html: string, attachments?: any[]) => {
    try {
        const profile = await prisma.businessProfile.findUnique({ where: { userId } });

        if (!profile || !profile.smtpHost || !profile.smtpUser || !profile.smtpPass) {
            console.log('SMTP not configured for user', userId);
            return;
        }

        const transporter = nodemailer.createTransport({
            host: profile.smtpHost,
            port: profile.smtpPort || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: profile.smtpUser,
                pass: profile.smtpPass,
            },
        });

        const info = await transporter.sendMail({
            from: `"${profile.companyName}" <${profile.smtpUser}>`,
            to,
            subject,
            html,
            attachments
        });

        console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

// System Email Transporter
const getSystemTransporter = () => {
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
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/auth/verify?token=${token}`;

    const transporter = getSystemTransporter();

    try {
        await transporter.sendMail({
            from: `"Mpesa Connect Support" <${process.env.SMTP_USER || 'system@mpesaconnect.co.ke'}>`,
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
};
