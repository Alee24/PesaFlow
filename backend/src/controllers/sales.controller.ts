
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createCashSale = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { items, totalAmount } = req.body; // items: { productId, quantity, price }[]

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No items in cart' });
        }

        // 1. Transaction (Cash Sale)
        // We record a completed transaction for the cash received.
        // We'll credit the merchant wallet immediately.

        await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });

            const transaction = await tx.transaction.create({
                data: {
                    type: 'SALE_CASH', // Need to check if this enum/string is valid in logic, schema is String so ok.
                    amount: totalAmount,
                    status: 'COMPLETED',
                    initiatorUserId: userId,
                    recipientWalletId: wallet.id,
                    reference: `CASH-${Date.now()}`,
                    metadata: JSON.stringify({ description: 'POS Cash Sale' })
                } as any // Type casting if schema strictness varies, but Schema says type is String.
            });

            // 2. Create Sale Record
            const sale = await tx.sale.create({
                data: {
                    merchantId: userId,
                    totalAmount: totalAmount,
                    paymentMethod: 'CASH',
                    transactionId: transaction.id,
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.price,
                            subtotal: item.price * item.quantity
                        }))
                    }
                }
            });

            // 3. Update Stock & Wallet
            await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: totalAmount } }
            });

            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stockQuantity: { decrement: item.quantity } }
                });
            }

            return sale;
        });

        res.json({ success: true, message: 'Cash sale recorded successfully' });

    } catch (error: any) {
        console.error("Cash Sale Error:", error);
        res.status(500).json({ error: 'Failed to process cash sale' });
    }
};

export const getRecentSales = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const sales = await prisma.sale.findMany({
            where: { merchantId: userId },
            include: {
                items: {
                    include: { product: true }
                },
                transaction: true
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json(sales);
    } catch (error) {
        console.error("Get Sales Error:", error);
        res.status(500).json({ error: 'Failed to fetch sales history' });
    }
};
