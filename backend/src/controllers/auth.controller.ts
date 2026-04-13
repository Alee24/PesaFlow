
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

import { verifyKRAPin } from '../services/kra-verification.service';

const registerSchema = z.object({
    email: z.string().email(),
    phoneNumber: z.string().min(10),
    password: z.string().min(6),
    role: z.string().optional().default('MERCHANT'),
});

const completeProfileSchema = z.object({
    companyName: z.string().min(1),
    idNumber: z.string().min(1),
    kraPinNumber: z.string().optional().or(z.literal('')),
    location: z.string().min(1),
    dataPolicyAccepted: z.any().transform(v => v === 'true' || v === true || v === 'on'),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

import crypto from 'crypto';
import { sendVerificationEmail } from '../services/email.service';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const body = req.body;
        const { email, phoneNumber, password, role } = registerSchema.parse(body);

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { phoneNumber }] },
        });

        if (existingUser) {
            res.status(400).json({ error: 'User with this email or phone already exists' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const result = await prisma.$transaction(async (tx) => {
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

            // 1. Create User
            const user = await tx.user.create({
                data: {
                    email,
                    phoneNumber,
                    passwordHash,
                    role,
                    status: 'PENDING_VERIFICATION',
                    emailVerified: false,
                    verificationToken,
                    subscription: {
                        create: {
                            plan: 'FREE',
                            status: 'ACTIVE',
                            features: '[]',
                            endDate: oneYearFromNow
                        }
                    }
                },
            });

            // 2. Create Wallet
            await tx.wallet.create({
                data: { userId: user.id },
            });

            return user;
        });

        // Truly backgrounded email send (non-blocking)
        setImmediate(() => {
            sendVerificationEmail(email, verificationToken).catch(err => {
                console.error('Background Email Error:', err);
            });
        });

        const token = jwt.sign(
            { userId: result.id, role: result.role, status: result.status },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '30d' } // Extended for better UX
        );

        return res.status(201).json({
            message: 'Account created successfully',
            token,
            user: {
                id: result.id,
                email: result.email,
                phoneNumber: result.phoneNumber,
                role: result.role,
                status: result.status,
                isProfileComplete: false
            }
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

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            res.status(400).json({ error: 'Invalid token' });
            return;
        }

        const user = await prisma.user.findFirst({
            where: { verificationToken: token }
        });

        if (!user) {
            res.status(400).json({ error: 'Invalid or expired verification token' });
            return;
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                verificationToken: null,
                status: 'ACTIVE' // Activate user upon email verification? Or keep PENDING_VERIFICATION for KYC?
                // Let's keep PENDING_VERIFICATION if they haven't done KYC.
                // But if they just need email to login, status should be handled carefully.
                // Original logic used PENDING_VERIFICATION. Let's keep it, but allow login if emailVerified is true.
            }
        });

        res.json({ message: 'Email verified successfully. You can now login.' });

    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const completeProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;
        const body = req.body;

        // Parse body
        const { companyName, idNumber, kraPinNumber, location, dataPolicyAccepted } = completeProfileSchema.parse(body);

        // Check if profile already exists
        const existingProfile = await prisma.businessProfile.findUnique({ where: { userId } });
        if (existingProfile) {
            res.status(400).json({ error: 'Business profile already exists' });
            return;
        }

        // Verify KRA PIN with KRA Service (if provided)
        if (kraPinNumber) {
            const kraCheck = await verifyKRAPin(kraPinNumber);
            if (!kraCheck.isValid) {
                res.status(400).json({ error: kraCheck.message || 'Invalid KRA PIN provided' });
                return;
            }
        }

        const files = req.files as any;
        const getFileUrl = (fieldName: string) => {
            if (files && files[fieldName] && files[fieldName][0]) {
                return `/uploads/${files[fieldName][0].filename}`;
            }
            return null;
        };

        await prisma.businessProfile.create({
            data: {
                userId,
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

        res.json({ message: 'Profile completed successfully. Pending verification.' });

    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessage = (error as any).errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
            res.status(400).json({ error: errorMessage });
        } else {
            console.error("Complete Profile Error:", error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: { email },
            include: { businessProfile: true }
        });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        if (user.status === 'SUSPENDED') {
            res.status(403).json({ error: 'Your account has been suspended. Please call 0724454757 for activation.' });
            return;
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role, status: user.status, parentId: user.parentId },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                isProfileComplete: !!user.businessProfile
            }
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
        const { email, phoneNumber, password, currentPassword, name, posPin } = req.body;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Verify current password before any sensitive changes if password is being changed
        // Or broadly require it. For now, let's require it only if changing password or email.
        if (password || email !== user.email || posPin) {
            if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
                res.status(401).json({ error: 'Invalid current password to set PIN or change sensitive info' });
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

        if (posPin) {
            if (posPin.length < 4) {
                res.status(400).json({ error: 'PIN must be at least 4 digits' });
                return;
            }
            updates.pin = await bcrypt.hash(posPin, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updates,
            include: { businessProfile: true }
        });

        res.json({
            message: 'User updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                role: updatedUser.role,
                status: updatedUser.status,
                hasPin: !!updatedUser.pin,
                isProfileComplete: !!updatedUser.businessProfile
            }
        });


    } catch (error) {
        console.error("Update User Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { businessProfile: true }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                isProfileComplete: !!user.businessProfile
            }
        });
    } catch (error) {
        console.error("Get User Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
