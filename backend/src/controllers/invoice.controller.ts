import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createInvoice = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { clientName, clientPhone, clientAddress, clientEmail, date, items, invoiceNumber, notes } = req.body;

        // Calculate total
        const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

        // Get Merchant Wallet
        const wallet = await prisma.wallet.findFirstOrThrow({ where: { userId } });

        // Create Transaction (Type: INVOICE)
        // We use 'metadata' to store the client details for now since we don't have a Client model
        const transaction = await prisma.transaction.create({
            data: {
                type: 'INVOICE',
                amount: totalAmount,
                reference: invoiceNumber,
                status: 'PENDING', // Invoice sent, not necessarily paid
                initiatorUserId: userId,
                recipientWalletId: wallet.id,
                metadata: JSON.stringify({
                    clientName,
                    clientPhone,
                    clientAddress,
                    clientEmail,
                    notes,
                    invoiceDate: date
                })
            }
        });

        // Ensure a fallback product exists for ad-hoc items
        let genericProduct = await prisma.product.findFirst({
            where: { merchantId: userId, name: 'General Invoice Item' }
        });

        if (!genericProduct) {
            genericProduct = await prisma.product.create({
                data: {
                    merchantId: userId,
                    name: 'General Invoice Item',
                    price: 0,
                    stockQuantity: 999999,
                    status: 'ACTIVE'
                }
            });
        }

        const genericProductId = genericProduct.id;

        // Create Sale Record
        const sale = await prisma.sale.create({
            data: {
                merchantId: userId,
                totalAmount: totalAmount,
                transactionId: transaction.id,
                paymentMethod: 'INVOICE',
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId || genericProductId,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        subtotal: item.price * item.quantity
                    }))
                }
            }
        });

        res.json({ transaction, sale });

    } catch (error) {
        console.error("Create Invoice Error:", error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
};

export const getInvoices = async (req: Request, res: Response) => {
    // Re-using logic or custom endpoint
    // We already have getTransactions in transaction.controller
    // This might be redundant or specific.
    // Let's just use createInvoice for now.
    res.status(501).json({ error: 'Not implemented' });
};
