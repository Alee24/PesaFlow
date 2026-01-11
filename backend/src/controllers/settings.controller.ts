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

        res.json({
            serviceChargeEnabled: settings.serviceChargeEnabled,
            serviceChargeAmount: settings.serviceChargeAmount
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
            smtpFromEmail
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
