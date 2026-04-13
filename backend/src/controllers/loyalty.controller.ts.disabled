import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: {
        id: string;
        userId: string;
        role: string;
    };
}

/**
 * Register a new loyalty customer
 */
export const registerCustomer = async (req: AuthRequest, res: Response) => {
    try {
        const { phoneNumber, idNumber, cardNumber, name, email } = req.body;
        const merchantId = req.user?.id;

        if (!merchantId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Validate that at least one identifier is provided
        if (!phoneNumber && !idNumber && !cardNumber) {
            return res.status(400).json({
                error: 'At least one identifier (phone, ID, or card number) is required'
            });
        }

        // Check if customer already exists
        const existing = await prisma.loyaltyCustomer.findFirst({
            where: {
                merchantId,
                OR: [
                    phoneNumber ? { phoneNumber } : {},
                    idNumber ? { idNumber } : {},
                    cardNumber ? { cardNumber } : {},
                ].filter(obj => Object.keys(obj).length > 0)
            }
        });

        if (existing) {
            return res.status(400).json({
                error: 'Customer already registered',
                customer: existing
            });
        }

        // Create new loyalty customer
        const customer = await prisma.loyaltyCustomer.create({
            data: {
                merchantId,
                phoneNumber,
                idNumber,
                cardNumber,
                name,
                email,
            }
        });

        res.status(201).json(customer);
    } catch (error) {
        console.error('Error registering loyalty customer:', error);
        res.status(500).json({ error: 'Failed to register customer' });
    }
};

/**
 * Get customer by ID
 */
export const getCustomer = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const merchantId = req.user?.id;

        const customer = await prisma.loyaltyCustomer.findFirst({
            where: { id, merchantId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                sales: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
};

/**
 * Search for customer by phone/ID/card number
 */
export const searchCustomer = async (req: AuthRequest, res: Response) => {
    try {
        const { query } = req.query;
        const merchantId = req.user?.id;

        if (!query) {
            return res.status(400).json({ error: 'Search query required' });
        }

        const customer = await prisma.loyaltyCustomer.findFirst({
            where: {
                merchantId,
                OR: [
                    { phoneNumber: query as string },
                    { idNumber: query as string },
                    { cardNumber: query as string },
                ]
            }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        console.error('Error searching customer:', error);
        res.status(500).json({ error: 'Failed to search customer' });
    }
};

/**
 * Earn points for a sale
 */
export const earnPoints = async (req: AuthRequest, res: Response) => {
    try {
        const { customerId, saleId, amount } = req.body;
        const merchantId = req.user?.id;

        // Get business profile to get points configuration
        const profile = await prisma.businessProfile.findUnique({
            where: { userId: merchantId }
        });

        if (!profile || !profile.loyaltyEnabled) {
            return res.status(400).json({ error: 'Loyalty program not enabled' });
        }

        const pointsToEarn = Math.floor(amount / profile.pointsPerKES);

        // Update customer points
        const customer = await prisma.loyaltyCustomer.update({
            where: { id: customerId },
            data: {
                totalPoints: { increment: pointsToEarn },
                availablePoints: { increment: pointsToEarn },
                lifetimePoints: { increment: pointsToEarn },
                lastVisit: new Date()
            }
        });

        // Create transaction record
        const transaction = await prisma.loyaltyTransaction.create({
            data: {
                customerId,
                saleId,
                type: 'EARN',
                points: pointsToEarn,
                description: `Earned ${pointsToEarn} points from purchase`,
                balanceBefore: customer.availablePoints - pointsToEarn,
                balanceAfter: customer.availablePoints
            }
        });

        res.json({ customer, transaction });
    } catch (error) {
        console.error('Error earning points:', error);
        res.status(500).json({ error: 'Failed to earn points' });
    }
};

/**
 * Redeem points
 */
export const redeemPoints = async (req: AuthRequest, res: Response) => {
    try {
        const { customerId, points, saleId } = req.body;
        const merchantId = req.user?.id;

        // Get business profile
        const profile = await prisma.businessProfile.findUnique({
            where: { userId: merchantId }
        });

        if (!profile || !profile.loyaltyEnabled) {
            return res.status(400).json({ error: 'Loyalty program not enabled' });
        }

        if (points < profile.minRedeemPoints) {
            return res.status(400).json({
                error: `Minimum ${profile.minRedeemPoints} points required to redeem`
            });
        }

        // Get customer
        const customer = await prisma.loyaltyCustomer.findUnique({
            where: { id: customerId }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        if (customer.availablePoints < points) {
            return res.status(400).json({ error: 'Insufficient points' });
        }

        // Update customer points
        const updatedCustomer = await prisma.loyaltyCustomer.update({
            where: { id: customerId },
            data: {
                availablePoints: { decrement: points },
                lastVisit: new Date()
            }
        });

        // Create transaction record
        const transaction = await prisma.loyaltyTransaction.create({
            data: {
                customerId,
                saleId,
                type: 'REDEEM',
                points: -points,
                description: `Redeemed ${points} points`,
                balanceBefore: customer.availablePoints,
                balanceAfter: updatedCustomer.availablePoints
            }
        });

        const discountAmount = points * profile.kesPerPoint;

        res.json({
            customer: updatedCustomer,
            transaction,
            discountAmount
        });
    } catch (error) {
        console.error('Error redeeming points:', error);
        res.status(500).json({ error: 'Failed to redeem points' });
    }
};

/**
 * Get customer transaction history
 */
export const getCustomerHistory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const merchantId = req.user?.id;

        // Verify customer belongs to merchant
        const customer = await prisma.loyaltyCustomer.findFirst({
            where: { id, merchantId }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const transactions = await prisma.loyaltyTransaction.findMany({
            where: { customerId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                sale: {
                    select: {
                        id: true,
                        totalAmount: true,
                        createdAt: true
                    }
                }
            }
        });

        res.json(transactions);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};

/**
 * Get all loyalty customers
 */
export const getAllCustomers = async (req: AuthRequest, res: Response) => {
    try {
        const merchantId = req.user?.id;
        const { page = 1, limit = 50 } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        const [customers, total] = await Promise.all([
            prisma.loyaltyCustomer.findMany({
                where: { merchantId },
                orderBy: { lastVisit: 'desc' },
                skip,
                take: Number(limit),
                include: {
                    _count: {
                        select: { transactions: true, sales: true }
                    }
                }
            }),
            prisma.loyaltyCustomer.count({ where: { merchantId } })
        ]);

        res.json({
            customers,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
};
