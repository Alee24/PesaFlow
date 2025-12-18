
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

const registerSchema = z.object({
    email: z.string().email(),
    phoneNumber: z.string().min(10),
    password: z.string().min(6),
    role: z.string().optional().default('MERCHANT'),
    // Business Profile Fields
    companyName: z.string().min(1),
    idNumber: z.string().min(1),
    kraPinNumber: z.string().min(1),
    location: z.string().min(1),
    dataPolicyAccepted: z.any().transform(v => v === 'true' || v === true || v === 'on'),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const body = req.body;
        // Parse the body with Zod
        const { email, phoneNumber, password, role, companyName, idNumber, kraPinNumber, location, dataPolicyAccepted } = registerSchema.parse(body);

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { phoneNumber }] },
        });

        if (existingUser) {
            res.status(400).json({ error: 'User with this email or phone already exists' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const protocol = req.protocol;
        const host = req.get('host');
        const files = req.files as any;

        const getFileUrl = (fieldName: string) => {
            if (files && files[fieldName] && files[fieldName][0]) {
                return `${protocol}://${host}/uploads/${files[fieldName][0].filename}`;
            }
            return null;
        };

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create User
            const user = await tx.user.create({
                data: {
                    email,
                    phoneNumber,
                    passwordHash,
                    role,
                    status: 'PENDING_VERIFICATION'
                },
            });

            // 2. Create Wallet
            await tx.wallet.create({
                data: { userId: user.id },
            });

            // 3. Create Business Profile with KYC Docs
            await tx.businessProfile.create({
                data: {
                    userId: user.id,
                    companyName,
                    idNumber,
                    kraPinNumber,
                    location,
                    dataPolicyAccepted,
                    idFrontUrl: getFileUrl('idFront'),
                    idBackUrl: getFileUrl('idBack'),
                    businessPermitUrl: getFileUrl('businessPermit'),
                    registrationCertUrl: getFileUrl('registrationCert'),
                    kraCertUrl: getFileUrl('kraCert'),
                }
            });

            return user;
        });

        const token = jwt.sign(
            { userId: result.id, role: result.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Registration submitted successfully. Your account is pending verification by our team.',
            token,
            user: { id: result.id, email: result.email, role: result.role, status: result.status }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessage = (error as any).errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
            res.status(400).json({ error: errorMessage });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        if (user.status === 'SUSPENDED') {
            res.status(403).json({ error: 'Your account has been suspended. Please call 0724454757 for activation.' });
            return;
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, email: user.email, role: user.role }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessage = (error as any).errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
            res.status(400).json({ error: errorMessage });
        } else {
            console.error("LOGIN ERROR FULL DETAILS:", error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;
        const { email, phoneNumber, password, currentPassword, name } = req.body;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Verify current password before any sensitive changes if password is being changed
        // Or broadly require it. For now, let's require it only if changing password or email.
        if (password || email !== user.email) {
            if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
                res.status(401).json({ error: 'Invalid current password' });
                return;
            }
        }

        const updates: any = {};

        if (email && email !== user.email) {
            const existingEmail = await prisma.user.findFirst({
                where: { email, id: { not: userId } }
            });
            if (existingEmail) {
                res.status(400).json({ error: 'Email already in use' });
                return;
            }
            updates.email = email;
        }

        if (phoneNumber && phoneNumber !== user.phoneNumber) {
            const existingPhone = await prisma.user.findFirst({
                where: { phoneNumber, id: { not: userId } }
            });
            if (existingPhone) {
                res.status(400).json({ error: 'Phone number already in use' });
                return;
            }
            updates.phoneNumber = phoneNumber;
        }

        if (name) updates.name = name;
        if (password) {
            updates.passwordHash = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updates,
        });

        res.json({
            message: 'User updated successfully',
            user: { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role }
        });

    } catch (error) {
        console.error("Update User Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
