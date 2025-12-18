
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const saleItemSchema = z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive(),
    discount: z.number().optional().default(0),
    tax: z.number().optional().default(0)
});

const saleSchema = z.object({
    items: z.array(saleItemSchema).min(1),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    customerEmail: z.string().optional(),
    discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
    discountValue: z.number().optional().default(0),
    paymentMethod: z.enum(['CASH', 'MPESA_STK', 'SPLIT']).default('CASH'),
    splitPayments: z.array(z.object({
        method: z.string(),
        amount: z.number()
    })).optional(),
    amountPaid: z.number().optional(),
    notes: z.string().optional()
});

// Helper function to create stock movement
async function createStockMovement(
    tx: any,
    productId: string,
    merchantId: string,
    quantity: number,
    previousStock: number,
    newStock: number,
    saleId: string
) {
    await tx.stockMovement.create({
        data: {
            productId,
            merchantId,
            type: 'OUT',
            quantity,
            previousStock,
            newStock,
            reason: 'Sale',
            reference: saleId,
            notes: 'Stock reduced due to sale'
        }
    });
}

export const createCashSale = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const validatedData = saleSchema.parse(req.body);

        const {
            items,
            customerName,
            customerPhone,
            customerEmail,
            discountType,
            discountValue,
            paymentMethod,
            splitPayments,
            amountPaid,
            notes
        } = validatedData;

        const result = await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });

            // Calculate totals
            let subtotal = 0;
            const processedItems = [];

            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId }
                });

                if (!product) {
                    throw new Error(`Product ${item.productId} not found`);
                }

                if (product.stockQuantity < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}`);
                }

                const itemSubtotal = (item.price * item.quantity) - item.discount + item.tax;
                subtotal += itemSubtotal;

                processedItems.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    discount: item.discount,
                    tax: item.tax,
                    subtotal: itemSubtotal,
                    product
                });
            }

            // Calculate discount
            let discountAmount = 0;
            if (discountType && discountValue) {
                if (discountType === 'PERCENTAGE') {
                    discountAmount = (subtotal * discountValue) / 100;
                } else {
                    discountAmount = discountValue;
                }
            }

            // Calculate tax (if not already in items)
            const taxAmount = processedItems.reduce((sum, item) => sum + item.tax, 0);

            const totalAmount = subtotal - discountAmount;
            const finalAmountPaid = amountPaid || totalAmount;
            const changeGiven = paymentMethod === 'CASH' ? Math.max(0, finalAmountPaid - totalAmount) : 0;
            const amountDue = Math.max(0, totalAmount - finalAmountPaid);
            const paymentStatus = amountDue > 0 ? 'PARTIAL' : 'PAID';

            // Create transaction (only for cash sales that credit wallet immediately)
            let transaction = null;
            if (paymentMethod === 'CASH' || (paymentMethod === 'SPLIT' && splitPayments)) {
                transaction = await tx.transaction.create({
                    data: {
                        type: 'SALE_CASH',
                        amount: totalAmount,
                        status: 'COMPLETED',
                        initiatorUserId: userId,
                        recipientWalletId: wallet.id,
                        reference: `CASH-${Date.now()}`,
                        metadata: JSON.stringify({
                            description: 'POS Cash Sale',
                            customerName,
                            items: processedItems.length
                        })
                    } as any
                });

                // Update wallet
                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: { balance: { increment: totalAmount } }
                });
            }

            // Create sale record
            const sale = await tx.sale.create({
                data: {
                    merchantId: userId,
                    customerName,
                    customerPhone,
                    customerEmail,
                    subtotal,
                    discountType,
                    discountValue,
                    discountAmount,
                    taxAmount,
                    totalAmount,
                    paymentMethod,
                    paymentStatus,
                    amountPaid: finalAmountPaid,
                    amountDue,
                    changeGiven,
                    splitPayments: splitPayments ? JSON.stringify(splitPayments) : null,
                    transactionId: transaction?.id,
                    notes,
                    items: {
                        create: processedItems.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            discount: item.discount,
                            tax: item.tax,
                            subtotal: item.subtotal
                        }))
                    }
                },
                include: {
                    items: {
                        include: { product: true }
                    }
                }
            });

            // Update stock and create movements
            for (const item of processedItems) {
                const previousStock = item.product.stockQuantity;
                const newStock = previousStock - item.quantity;

                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQuantity: newStock,
                        status: newStock === 0 ? 'OUT_OF_STOCK' : 'ACTIVE'
                    }
                });

                await createStockMovement(
                    tx,
                    item.productId,
                    userId,
                    item.quantity,
                    previousStock,
                    newStock,
                    sale.id
                );
            }

            return { sale, changeGiven };
        });

        res.json({
            success: true,
            message: 'Sale recorded successfully',
            sale: result.sale,
            changeGiven: result.changeGiven
        });

    } catch (error: any) {
        console.error("Cash Sale Error:", error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }

        res.status(500).json({ error: error.message || 'Failed to process sale' });
    }
};

export const getRecentSales = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { limit = 20, status, paymentMethod } = req.query;

        const where: any = { merchantId: userId };

        if (status) {
            where.paymentStatus = status;
        }

        if (paymentMethod) {
            where.paymentMethod = paymentMethod;
        }

        const sales = await prisma.sale.findMany({
            where,
            include: {
                items: {
                    include: { product: true }
                },
                transaction: true
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit)
        });

        res.json(sales);
    } catch (error) {
        console.error("Get Sales Error:", error);
        res.status(500).json({ error: 'Failed to fetch sales history' });
    }
};

// New endpoint: Get sale by ID
export const getSaleById = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;

        const sale = await prisma.sale.findFirst({
            where: {
                id,
                merchantId: userId
            },
            include: {
                items: {
                    include: { product: true }
                },
                transaction: true
            }
        });

        if (!sale) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        res.json(sale);
    } catch (error) {
        console.error("Get Sale Error:", error);
        res.status(500).json({ error: 'Failed to fetch sale' });
    }
};

// New endpoint: Get sales statistics
export const getSalesStats = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { startDate, endDate } = req.query;

        const where: any = { merchantId: userId };

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const sales = await prisma.sale.findMany({
            where,
            include: {
                items: true
            }
        });

        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
        const totalDiscount = sales.reduce((sum, sale) => sum + Number(sale.discountAmount), 0);
        const totalTax = sales.reduce((sum, sale) => sum + Number(sale.taxAmount), 0);
        const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

        const paymentMethods = sales.reduce((acc: any, sale) => {
            acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1;
            return acc;
        }, {});

        const topProducts = await prisma.saleItem.groupBy({
            by: ['productId'],
            where: {
                sale: {
                    merchantId: userId
                }
            },
            _sum: {
                quantity: true,
                subtotal: true
            },
            orderBy: {
                _sum: {
                    quantity: 'desc'
                }
            },
            take: 10
        });

        res.json({
            totalSales,
            totalRevenue,
            totalDiscount,
            totalTax,
            averageSale,
            paymentMethods,
            topProducts
        });
    } catch (error) {
        console.error("Sales Stats Error:", error);
        res.status(500).json({ error: 'Failed to fetch sales statistics' });
    }
};
