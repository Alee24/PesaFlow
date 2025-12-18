import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const productSchema = z.object({
    name: z.string().min(1),
    price: z.string().or(z.number()).transform(val => Number(val)),
    stockQuantity: z.string().or(z.number()).transform(val => Number(val)).optional().default(0),
    sku: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    categoryId: z.string().optional().nullable(),
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
            orderBy: { createdAt: 'desc' },
            include: { category: true } // Include category details
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

        let rawData = { ...req.body };
        if (req.file) {
            const protocol = req.protocol;
            const host = req.get('host');
            rawData.imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
        }

        const { name, price, stockQuantity, sku, description, imageUrl, categoryId } = productSchema.parse(rawData);

        const product = await prisma.product.create({
            data: {
                merchantId: req.user.userId,
                name,
                price,
                stockQuantity,
                sku,
                description,
                imageUrl,
                categoryId: categoryId || null,
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
// ... existing createProduct

export const getProductById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id }
        });

        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        // Optional: Check ownership if strict multi-tenant
        if (product.merchantId !== req.user?.userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        let rawData = { ...req.body };
        if (req.file) {
            const protocol = req.protocol;
            const host = req.get('host');
            rawData.imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
        }

        const { name, price, stockQuantity, sku, description, imageUrl, categoryId } = productSchema.parse(rawData);

        // Security check
        const existing = await prisma.product.findUnique({ where: { id } });
        if (!existing || existing.merchantId !== req.user?.userId) {
            res.status(403).json({ error: 'Forbidden or Product not found' });
            return;
        }

        const updated = await prisma.product.update({
            where: { id },
            data: {
                name,
                price,
                stockQuantity,
                sku,
                description,
                imageUrl,
                categoryId: categoryId || null
            }
        });

        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to update product' });
        }
    }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const existing = await prisma.product.findUnique({ where: { id } });
        if (!existing || existing.merchantId !== req.user?.userId) {
            res.status(403).json({ error: 'Forbidden or Product not found' });
            return;
        }

        // Soft delete - set status to ARCHIVED
        await prisma.product.update({
            where: { id },
            data: { status: 'ARCHIVED' }
        });

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};
