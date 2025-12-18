import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createInvoice = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { clientName, clientPhone, clientAddress, clientEmail, date, dueDate, items, invoiceNumber, notes } = req.body;

        // Fetch Wallet & Profile
        const wallet = await prisma.wallet.findFirstOrThrow({ where: { userId } });
        const profile = await prisma.businessProfile.findUnique({ where: { userId } });

        // Calculate Totals
        const subTotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

        let vatAmount = 0;
        const vatRate = profile?.vatRate || 16.0;
        if (profile?.vatEnabled) {
            vatAmount = subTotal * (vatRate / 100);
        }

        const totalAmount = subTotal + vatAmount;

        // Create Transaction (Type: INVOICE)
        const transaction = await prisma.transaction.create({
            data: {
                type: 'INVOICE',
                amount: totalAmount,
                reference: invoiceNumber,
                status: 'PENDING',
                initiatorUserId: userId,
                recipientWalletId: wallet.id,
                metadata: JSON.stringify({
                    clientName,
                    clientPhone,
                    clientAddress,
                    clientEmail,
                    notes,
                    invoiceDate: date,
                    dueDate: dueDate,
                    itemsSnapshot: items,
                    subTotal,
                    vatAmount,
                    vatRate: profile?.vatEnabled ? vatRate : 0,
                    vatEnabled: profile?.vatEnabled || false
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

        // Create Notification
        await prisma.notification.create({
            data: {
                userId,
                title: 'Invoice Created',
                message: `Invoice #${invoiceNumber} for KES ${totalAmount.toLocaleString()} created.`,
                type: 'info'
            }
        });

        // Send Email Notification
        if (clientEmail) {
            import('../services/email.service').then(({ sendEmail }) => {
                const emailHtml = `
                    <h1>Invoice #${invoiceNumber}</h1>
                    <p>Dear ${clientName},</p>
                    <p>Here is your invoice for KES ${totalAmount.toLocaleString()}.</p>
                    <p>Please pay by ${date}.</p>
                    <br>
                    <p>Thank you!</p>
                `;
                sendEmail(userId, clientEmail, `Invoice from ${req.body.companyName || 'Us'}`, emailHtml);
            });
        }

        res.json({ transaction, sale });

    } catch (error) {
        console.error("Create Invoice Error:", error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
};

export const getInvoices = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const wallet = await prisma.wallet.findFirst({ where: { userId } });

        if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

        const invoices = await prisma.transaction.findMany({
            where: {
                recipientWalletId: wallet.id,
                type: 'INVOICE'
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(invoices);
    } catch (error) {
        console.error("Get Invoices Error:", error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
};
