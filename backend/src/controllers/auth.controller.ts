
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

        // Email verification deadline: 24 hours from now
        const verificationDeadline = new Date();
        verificationDeadline.setHours(verificationDeadline.getHours() + 24);

        const result = await prisma.$transaction(async (tx) => {
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

            const promoFeatures = JSON.stringify([
                'invoices', 'withdrawals', 'team', 'analytics',
                'reports', 'CRM', 'ADVANCED_CRM', 'POS', 'BANK_INTEGRATION'
            ]);

            // Create User — ACTIVE immediately so they can login right away
            const user = await tx.user.create({
                data: {
                    email,
                    phoneNumber,
                    passwordHash,
                    role,
                    status: 'ACTIVE',           // ✅ Immediate access
                    emailVerified: false,
                    verificationToken,
                    tokenExpiresAt: verificationDeadline, // ⏰ 24h deadline
                    subscription: {
                        create: {
                            plan: 'PRO',
                            status: 'ACTIVE',
                            features: promoFeatures,
                            endDate: oneYearFromNow
                        }
                    }
                },
            });

            // Create Wallet
            await tx.wallet.create({
                data: { userId: user.id },
            });

            // Create immediate verify-email notification
            await tx.notification.create({
                data: {
                    userId: user.id,
                    title: '📧 Verify Your Email Address',
                    message: `Please verify your email (${email}) within 24 hours. Your account will be suspended if not verified by ${verificationDeadline.toLocaleString()}.`,
                    type: 'warning'
                }
            });

            return user;
        });

        // Non-blocking background email send
        setImmediate(() => {
            sendVerificationEmail(email, verificationToken).catch(err => {
                console.error('Background Email Error:', err);
            });
        });

        const token = jwt.sign(
            { userId: result.id, role: result.role, status: result.status },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '30d' }
        );

        res.status(201).json({
            message: 'Account created successfully. Please verify your email within 24 hours.',
            token,
            user: {
                id: result.id,
                email: result.email,
                phoneNumber: result.phoneNumber,
                role: result.role,
                status: result.status,
                emailVerified: false,
                isProfileComplete: false,
                onboardingSkipped: false
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

export const skipOnboarding = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;
        const user = await prisma.user.update({
            where: { id: userId },
            data: { onboardingSkipped: true }
        });

        res.json({ message: 'Onboarding skipped', onboardingSkipped: true });
    } catch (error) {
        console.error("Skip Onboarding Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
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

        // ─── 24-Hour Email Verification Enforcement ───────────────────────
        if (!user.emailVerified && user.role === 'MERCHANT') {
            const deadline = user.tokenExpiresAt ? new Date(user.tokenExpiresAt) : null;
            const now = new Date();

            if (deadline && now > deadline) {
                // Deadline passed — suspend the account
                if (user.status !== 'SUSPENDED') {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { status: 'SUSPENDED' }
                    });
                }
                res.status(403).json({
                    error: 'Your account has been suspended because your email was not verified within 24 hours. Please contact support at 0724454757 or verify your email to reactivate.'
                });
                return;
            }
        }
        // ──────────────────────────────────────────────────────────────────

        if (user.status === 'SUSPENDED') {
            res.status(403).json({ error: 'Your account has been suspended. Please contact support at 0724454757 for reactivation.' });
            return;
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role, status: user.status, parentId: user.parentId },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        // ─── Persistent Notifications on Login ────────────────────────────
        try {
            const notifPromises: Promise<any>[] = [];

            // 1. Email verification reminder (shown every login until verified)
            if (!user.emailVerified && user.role === 'MERCHANT') {
                const deadline = user.tokenExpiresAt ? new Date(user.tokenExpiresAt) : null;
                const hoursLeft = deadline ? Math.max(0, Math.round((deadline.getTime() - Date.now()) / 3600000)) : null;

                // Remove any old verify notification, then create fresh one with updated countdown
                await prisma.notification.deleteMany({
                    where: { userId: user.id, title: '📧 Verify Your Email Address' }
                });
                notifPromises.push(
                    prisma.notification.create({
                        data: {
                            userId: user.id,
                            title: '📧 Verify Your Email Address',
                            message: hoursLeft !== null
                                ? `Your account will be suspended in ${hoursLeft} hour(s) if you don't verify your email (${user.email}). Check your inbox for the verification link.`
                                : `Please verify your email (${user.email}) to keep your account active. Check your inbox for the verification link.`,
                            type: 'warning'
                        }
                    })
                );
            }

            // 2. M-Pesa credentials reminder
            if (user.role === 'MERCHANT' && (!user.businessProfile || !user.businessProfile.mpesaConsumerKey)) {
                const existingMpesaNotif = await prisma.notification.findFirst({
                    where: { userId: user.id, title: 'Set up M-Pesa Credentials' }
                });
                if (!existingMpesaNotif) {
                    notifPromises.push(
                        prisma.notification.create({
                            data: {
                                userId: user.id,
                                title: 'Set up M-Pesa Credentials',
                                message: 'To use STK push payments, please configure your own M-Pesa API Consumer Key & Secret in Settings.',
                                type: 'warning'
                            }
                        })
                    );
                }
            }

            await Promise.all(notifPromises);
        } catch (notifErr) {
            console.error('[Notification Error] Failed to create login alerts:', notifErr);
        }
        // ──────────────────────────────────────────────────────────────────

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                emailVerified: user.emailVerified,
                isProfileComplete: !!user.businessProfile,
                onboardingSkipped: user.onboardingSkipped
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessage = (error as any).errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
            res.status(400).json({ error: errorMessage });
        } else {
            console.error('LOGIN ERROR FULL DETAILS:', error);
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
                isProfileComplete: !!updatedUser.businessProfile,
                onboardingSkipped: updatedUser.onboardingSkipped
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
                isProfileComplete: !!user.businessProfile,
                onboardingSkipped: user.onboardingSkipped
            }
        });
    } catch (error) {
        console.error("Get User Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
