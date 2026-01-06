import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../services/email.service';

const prisma = new PrismaClient();

export const createInvoice = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { clientName, clientPhone, clientAddress, clientEmail, date, dueDate, items, invoiceNumber, notes } = req.body;

        console.log(`[Invoice] Creating for User: ${userId}`);
        console.log(`[Invoice] Payload:`, JSON.stringify(req.body));

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
                    clientName: clientName?.substring(0, 50), // Truncate to save space
                    invoiceDate: date,
                    hasItems: items.length > 0
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

        // Send Email Notification (Async, don't block response)
        if (clientEmail) {
            const emailHtml = `
                    <h1>Invoice #${invoiceNumber}</h1>
                    <p>Dear ${clientName},</p>
                    <p>Here is your invoice for KES ${totalAmount.toLocaleString()}.</p>
                    <p>Please pay by ${date}.</p>
                    <br>
                    <p>Thank you!</p>
                `;
            // Fire and forget, but catch errors to prevent crash
            sendEmail(userId, clientEmail, `Invoice from ${req.body.companyName || 'Us'}`, emailHtml)
                .catch(err => console.error("Failed to send invoice email:", err));
        }

        res.json({ transaction, sale });

    } catch (error: any) {
        console.error("Create Invoice Error:", error);
        // Return explicit error message for debugging
        res.status(500).json({
            error: 'Failed to create invoice',
            details: error.message || String(error)
        });
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
            orderBy: { createdAt: 'desc' },
            include: {
                sale: true // Include sale details
            }
        });

        res.json(invoices);
    } catch (error) {
        console.error("Get Invoices Error:", error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
};

export const sendInvoiceEmail = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email address is required' });
        }

        const transaction = await prisma.transaction.findFirst({
            where: {
                id,
                initiatorUserId: userId,
                type: 'INVOICE'
            }
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const profile = await prisma.businessProfile.findUnique({ where: { userId } });
        const senderName = profile?.companyName || 'Us';

        let metadata: any = {};
        try {
            metadata = JSON.parse(transaction.metadata as string);
        } catch (e) {
            metadata = transaction.metadata || {};
        }

        const statsMap: Record<string, string> = {
            'PENDING': 'Due',
            'PAID': 'Paid',
            'COMPLETED': 'Paid',
            'CANCELLED': 'Cancelled'
        };

        const statusText = statsMap[transaction.status] || transaction.status;
        const color = transaction.status === 'COMPLETED' || transaction.status === 'PAID' ? 'green' : 'gray';

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4f46e5;">Invoice #${transaction.reference}</h1>
                <p>Dear ${metadata.clientName || 'Customer'},</p>
                <p>Here is your invoice for <strong>KES ${Number(transaction.amount).toLocaleString()}</strong>.</p>
                
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${color}; font-weight: bold;">${statusText}</span></p>
                    <p style="margin: 5px 0;"><strong>Due Date:</strong> ${metadata.invoiceDate}</p>
                </div>
                
                <p>Please find the details attached or viewable in your portal.</p>
                <br>
                <p>Thank you for your business!</p>
                <p><strong>${senderName}</strong></p>
            </div>
        `;

        let attachments: any[] = [];
        if (req.file) {
            attachments.push({
                filename: req.file.originalname,
                content: req.file.buffer
            });
        }

        await sendEmail(userId, email, `Invoice #${transaction.reference} from ${senderName}`, emailHtml, attachments);

        res.json({ message: 'Invoice sent successfully' });

    } catch (error: any) {
        console.error("Send Invoice Email Error:", error);
        res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
};
