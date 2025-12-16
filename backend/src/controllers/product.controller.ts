import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const productSchema = z.object({
    name: z.string().min(1),
    price: z.string().or(z.number()).transform(val => Number(val)),
    stockQuantity: z.string().or(z.number()).transform(val => Number(val)).optional().default(0),
    sku: z.string().optional(),
});

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const products = await prisma.product.findMany({
            where: { merchantId: req.user.userId, status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' }
        });
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { name, price, stockQuantity, sku } = productSchema.parse(req.body);

        const product = await prisma.product.create({
            data: {
                merchantId: req.user.userId,
                name,
                price,
                stockQuantity,
                sku,
                status: 'ACTIVE'
            }
        });

        res.status(201).json(product);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessage = (error as any).errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
            res.status(400).json({ error: errorMessage });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Failed to create product' });
        }
    }
};
