import { Request, Response } from 'express';
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
    vatNumber: z.string().optional().or(z.literal('')),
    bankDetails: z.string().optional().or(z.literal('')),
    mpesaDetails: z.string().optional().or(z.literal('')),
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
        const data = profileSchema.parse(req.body);

        const profile = await prisma.businessProfile.upsert({
            where: { userId },
            update: data,
            create: { ...data, userId },
        });

        res.json(profile);
    } catch (error: any) {
        console.error("Update Profile Error:", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
