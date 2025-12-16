
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This is a partial mock for now as we don't have real transaction data flow from Safaricom yet
export const getTransactions = async (req: Request, res: Response) => {
    try {
        const transactions = await prisma.transaction.findMany({
            orderBy: { createdAt: 'desc' },
            include: { initiator: true }
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
};
