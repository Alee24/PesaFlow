
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
    role: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, phoneNumber, password, role } = registerSchema.parse(req.body);

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { phoneNumber }] },
        });

        if (existingUser) {
            res.status(400).json({ error: 'User with this email or phone already exists' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Transaction to create User and Wallet atomically
        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email,
                    phoneNumber,
                    passwordHash,
                    role: role || 'MERCHANT',
                },
            });

            // Create a wallet for the new user
            await tx.wallet.create({
                data: {
                    userId: newUser.id,
                },
            });

            return newUser;
        });

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: user.id, email: user.email, role: user.role }
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
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};
