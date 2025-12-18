
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const userRole = (req as any).user.role;
        const { startDate, endDate, status } = req.query;

        const where: any = {};

        // Enforce user filter if not admin
        if (userRole !== 'ADMIN') {
            const userWallets = await prisma.wallet.findMany({ where: { userId }, select: { id: true } });
            const walletIds = userWallets.map(w => w.id);
            where.OR = [
                { initiatorUserId: userId },
                { recipientWalletId: { in: walletIds } }
            ];
        }

        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string)
            };
        } else if (startDate) {
            where.createdAt = {
                gte: new Date(startDate as string)
            };
        }

        if (status && status !== 'ALL') {
            where.status = status;
        }

        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                initiator: { select: { name: true, email: true } },
                sale: {
                    include: {
                        items: {
                            include: {
                                product: {
                                    select: { name: true, sku: true }
                                }
                            }
                        }
                    }
                }
            }
        });
        res.json(transactions);
    } catch (error) {
        console.error("Get Transactions Error:", error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
};

export const getTransactionById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: {
                initiator: {
                    include: { businessProfile: true }
                },
                recipientWallet: true,
                sale: {
                    include: {
                        items: {
                            include: { product: true }
                        }
                    }
                }
            }
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const userId = (req as any).user.userId;
        const userRole = (req as any).user.role;

        if (userRole !== 'ADMIN') {
            const isInitiator = transaction.initiatorUserId === userId;
            const isRecipient = transaction.recipientWallet.userId === userId;

            if (!isInitiator && !isRecipient) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        res.json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch transaction details' });
    }
};

export const updateTransactionStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const transaction = await prisma.transaction.update({
            where: { id },
            data: { status },
            include: { initiator: true }
        });

        // Send Email Notification if Paid
        if ((status === 'COMPLETED' || status === 'PAID') && transaction.type === 'INVOICE') {
            try {
                let metadata: any = {};
                if (transaction.metadata) {
                    metadata = JSON.parse(transaction.metadata);
                }

                if (metadata.clientEmail) {
                    const { sendEmail } = await import('../services/email.service');
                    const emailHtml = `
                        <h1>Payment Received</h1>
                        <p>Dear ${metadata.clientName || 'Customer'},</p>
                        <p>We verify that we have received your payment of <b>KES ${Number(transaction.amount).toLocaleString()}</b> for Invoice #${transaction.reference}.</p>
                        <p>Status: <b style="color:green">PAID</b></p>
                        <br>
                        <p>Thank you for your business!</p>
                    `;
                    // Send to Client
                    await sendEmail(transaction.initiatorUserId!, metadata.clientEmail, `Payment Receipt for Invoice #${transaction.reference}`, emailHtml);

                    // Send to Merchant (Initiator) as well
                    if (transaction.initiator?.email) {
                        await sendEmail(transaction.initiatorUserId!, transaction.initiator.email, `Invoice Paid: #${transaction.reference}`, `<p>Your invoice #${transaction.reference} has been marked as PAID.</p>`);
                    }
                }
            } catch (emailError) {
                console.error("Failed to send payment email:", emailError);
                // Don't fail the request, just log it
            }
        }

        res.json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update transaction status' });
    }
};
