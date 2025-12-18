
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sendEmail = async (userId: string, to: string, subject: string, html: string) => {
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
        });

        console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};
