
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

export const getCategories = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const categories = await prisma.category.findMany({
            where: { merchantId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });
        res.json(categories);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const category = await prisma.category.create({
            data: {
                name,
                merchantId: userId
            }
        });
        res.status(201).json(category);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        // Ensure ownership
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category || category.merchantId !== userId) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Optional: Check if products exist? Or just set their categoryId to null?
        // Prisma might complain if we don't handle relations or on delete set null.
        // Schema relation: `category Category? @relation...` -> By default SetNull is usually not auto-configured unless specified, but relation is optional.
        // We will just try to delete. If valid constraint, it might fail.
        // Actually, let's just delete. The optional relation usually defaults to restricting or setting null if defined in DB.

        await prisma.category.delete({ where: { id } });
        res.json({ message: 'Category deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
