import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const productSchema = z.object({
    name: z.string().min(1),
    price: z.string().or(z.number()).transform(val => Number(val)),
    costPrice: z.string().or(z.number()).transform(val => Number(val)).optional(),
    stockQuantity: z.string().or(z.number()).transform(val => Number(val)).optional().default(0),
    minStockLevel: z.string().or(z.number()).transform(val => Number(val)).optional().default(0),
    maxStockLevel: z.string().or(z.number()).transform(val => Number(val)).optional().nullable(),
    reorderPoint: z.string().or(z.number()).transform(val => Number(val)).optional().default(10),
    reorderQuantity: z.string().or(z.number()).transform(val => Number(val)).optional().nullable(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    categoryId: z.string().optional().nullable(),
    isTaxable: z.boolean().optional().default(false),
    taxRate: z.string().or(z.number()).transform(val => Number(val)).optional().default(0),
    unit: z.string().optional().default('pcs'),
    supplierName: z.string().optional(),
    supplierContact: z.string().optional(),
    batchNumber: z.string().optional(),
    expiryDate: z.string().optional().nullable(),
});

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

// Helper function to create stock movement
async function createStockMovement(
    productId: string,
    merchantId: string,
    type: string,
    quantity: number,
    previousStock: number,
    newStock: number,
    reason?: string,
    reference?: string,
    notes?: string
) {
    await prisma.stockMovement.create({
        data: {
            productId,
            merchantId,
            type,
            quantity,
            previousStock,
            newStock,
            reason,
            reference,
            notes
        }
    });
}

export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { status, lowStock, search } = req.query;

        const where: any = {
            merchantId: req.user.userId,
        };

        // Filter by status
        if (status && status !== 'ALL') {
            where.status = status;
        } else {
            where.status = { not: 'ARCHIVED' };
        }

        // Filter low stock items
        if (lowStock === 'true') {
            where.stockQuantity = { lte: prisma.product.fields.reorderPoint };
        }

        // Search by name, SKU, or barcode
        if (search) {
            where.OR = [
                { name: { contains: search as string } },
                { sku: { contains: search as string } },
                { barcode: { contains: search as string } }
            ];
        }

        const products = await prisma.product.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                category: true,
                _count: {
                    select: {
                        stockMovements: true
                    }
                }
            }
        });

        // Add low stock indicator
        const productsWithAlerts = products.map(product => ({
            ...product,
            isLowStock: product.stockQuantity <= product.reorderPoint,
            isOutOfStock: product.stockQuantity === 0
        }));

        res.json(productsWithAlerts);
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

        // Handle image upload
        if (req.file) {
            rawData.imageUrl = `/uploads/${req.file.filename}`;
        }

        const data = productSchema.parse(rawData);

        const product = await prisma.product.create({
            data: {
                ...data,
                merchantId: req.user.userId,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
            },
            include: { category: true }
        });

        // Create initial stock movement if stock > 0
        if (product.stockQuantity > 0) {
            await createStockMovement(
                product.id,
                req.user.userId,
                'IN',
                product.stockQuantity,
                0,
                product.stockQuantity,
                'Initial stock',
                undefined,
                'Product created with initial stock'
            );
        }

        res.status(201).json(product);
    } catch (error: any) {
        console.error(error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        res.status(500).json({ error: 'Failed to create product' });
    }
};

export const getProductById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;

        const product = await prisma.product.findFirst({
            where: {
                id,
                merchantId: req.user.userId
            },
            include: {
                category: true,
                stockMovements: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        });

        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;

        // Check ownership
        const existing = await prisma.product.findFirst({
            where: { id, merchantId: req.user.userId }
        });

        if (!existing) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        let rawData = { ...req.body };

        if (req.file) {
            rawData.imageUrl = `/uploads/${req.file.filename}`;
        }

        const data = productSchema.partial().parse(rawData);

        // Track stock changes
        const stockChanged = data.stockQuantity !== undefined && data.stockQuantity !== existing.stockQuantity;

        const product = await prisma.product.update({
            where: { id },
            data: {
                ...data,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
            },
            include: { category: true }
        });

        // Create stock movement if stock changed
        if (stockChanged && data.stockQuantity !== undefined) {
            const diff = data.stockQuantity - existing.stockQuantity;
            await createStockMovement(
                product.id,
                req.user.userId,
                diff > 0 ? 'IN' : 'OUT',
                Math.abs(diff),
                existing.stockQuantity,
                data.stockQuantity,
                'Manual adjustment',
                undefined,
                'Stock updated via product edit'
            );
        }

        res.json(product);
    } catch (error: any) {
        console.error(error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        res.status(500).json({ error: 'Failed to update product' });
    }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;

        const product = await prisma.product.findFirst({
            where: { id, merchantId: req.user.userId }
        });

        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        // Soft delete
        await prisma.product.update({
            where: { id },
            data: { status: 'ARCHIVED' }
        });

        res.json({ message: 'Product archived successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};

// New endpoint: Adjust stock
export const adjustStock = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const { quantity, type, reason, notes } = req.body;

        if (!quantity || !type) {
            res.status(400).json({ error: 'Quantity and type are required' });
            return;
        }

        const product = await prisma.product.findFirst({
            where: { id, merchantId: req.user.userId }
        });

        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        let newStock = product.stockQuantity;

        if (type === 'IN') {
            newStock += quantity;
        } else if (type === 'OUT') {
            newStock -= quantity;
            if (newStock < 0) newStock = 0;
        } else if (type === 'ADJUSTMENT') {
            newStock = quantity;
        }

        const updated = await prisma.product.update({
            where: { id },
            data: {
                stockQuantity: newStock,
                status: newStock === 0 ? 'OUT_OF_STOCK' : 'ACTIVE'
            }
        });

        await createStockMovement(
            id,
            req.user.userId,
            type,
            Math.abs(newStock - product.stockQuantity),
            product.stockQuantity,
            newStock,
            reason,
            undefined,
            notes
        );

        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to adjust stock' });
    }
};

// New endpoint: Get stock movements
export const getStockMovements = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { productId, type, limit = 50 } = req.query;

        const where: any = {
            merchantId: req.user.userId
        };

        if (productId) {
            where.productId = productId;
        }

        if (type) {
            where.type = type;
        }

        const movements = await prisma.stockMovement.findMany({
            where,
            include: {
                product: {
                    select: {
                        name: true,
                        sku: true,
                        barcode: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit)
        });

        res.json(movements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stock movements' });
    }
};

// New endpoint: Get inventory stats
export const getInventoryStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const products = await prisma.product.findMany({
            where: {
                merchantId: req.user.userId,
                status: { not: 'ARCHIVED' }
            }
        });

        const totalProducts = products.length;
        const lowStockItems = products.filter(p => p.stockQuantity <= p.reorderPoint).length;
        const outOfStockItems = products.filter(p => p.stockQuantity === 0).length;

        const totalValue = products.reduce((sum, p) => {
            return sum + (Number(p.price) * p.stockQuantity);
        }, 0);

        const totalCost = products.reduce((sum, p) => {
            return sum + (Number(p.costPrice || 0) * p.stockQuantity);
        }, 0);

        res.json({
            totalProducts,
            lowStockItems,
            outOfStockItems,
            totalValue,
            totalCost,
            estimatedProfit: totalValue - totalCost
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch inventory stats' });
    }
};
