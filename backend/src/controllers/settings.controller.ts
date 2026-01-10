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
        const { serviceChargeEnabled, serviceChargeAmount } = req.body;

        // Validate inputs
        if (typeof serviceChargeEnabled !== 'boolean') {
            return res.status(400).json({ error: 'serviceChargeEnabled must be a boolean' });
        }

        if (typeof serviceChargeAmount !== 'number' || serviceChargeAmount < 0) {
            return res.status(400).json({ error: 'serviceChargeAmount must be a positive number' });
        }

        // Get existing settings or create new
        let settings = await prisma.systemSettings.findFirst();

        if (settings) {
            settings = await prisma.systemSettings.update({
                where: { id: settings.id },
                data: {
                    serviceChargeEnabled,
                    serviceChargeAmount
                }
            });
        } else {
            settings = await prisma.systemSettings.create({
                data: {
                    serviceChargeEnabled,
                    serviceChargeAmount
                }
            });
        }

        res.json({ message: 'Settings updated successfully', settings });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
