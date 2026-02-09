import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: {
        userId: string;
        merchantId?: string;
        role: string;
    };
}

// Create customer segment (PRO only)
export const createSegment = async (req: AuthRequest, res: Response) => {
    try {
        const merchantId = req.user?.merchantId || req.user?.userId;
        const { name, description, criteria, autoUpdate } = req.body;

        if (!name || !criteria) {
            return res.status(400).json({ error: 'Segment name and criteria are required' });
        }

        const segment = await prisma.customerSegment.create({
            data: {
                merchantId: merchantId!,
                name,
                description,
                criteria: JSON.stringify(criteria),
                autoUpdate: autoUpdate !== false
            }
        });

        // Apply segment criteria to existing customers
        await applySegmentCriteria(segment.id, merchantId!, criteria);

        res.status(201).json(segment);
    } catch (error: any) {
        console.error('Create segment error:', error);
        res.status(500).json({ error: 'Failed to create segment' });
    }
};

// Get all segments
export const getSegments = async (req: AuthRequest, res: Response) => {
    try {
        const merchantId = req.user?.merchantId || req.user?.userId;

        const segments = await prisma.customerSegment.findMany({
            where: { merchantId },
            include: {
                _count: {
                    select: { customers: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(segments);
    } catch (error: any) {
        console.error('Get segments error:', error);
        res.status(500).json({ error: 'Failed to fetch segments' });
    }
};

// Get segment customers
export const getSegmentCustomers = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const merchantId = req.user?.merchantId || req.user?.userId;

        const segment = await prisma.customerSegment.findFirst({
            where: { id, merchantId },
            include: {
                customers: {
                    include: {
                        customer: true
                    }
                }
            }
        });

        if (!segment) {
            return res.status(404).json({ error: 'Segment not found' });
        }

        res.json(segment);
    } catch (error: any) {
        console.error('Get segment customers error:', error);
        res.status(500).json({ error: 'Failed to fetch segment customers' });
    }
};

// Create email campaign (PRO only)
export const createCampaign = async (req: AuthRequest, res: Response) => {
    try {
        const merchantId = req.user?.merchantId || req.user?.userId;
        const { name, subject, content, segmentId, scheduledAt } = req.body;

        if (!name || !subject || !content) {
            return res.status(400).json({ error: 'Campaign name, subject, and content are required' });
        }

        const campaign = await prisma.emailCampaign.create({
            data: {
                merchantId: merchantId!,
                name,
                subject,
                content,
                segmentId,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                status: scheduledAt ? 'SCHEDULED' : 'DRAFT'
            }
        });

        res.status(201).json(campaign);
    } catch (error: any) {
        console.error('Create campaign error:', error);
        res.status(500).json({ error: 'Failed to create campaign' });
    }
};

// Get all campaigns
export const getCampaigns = async (req: AuthRequest, res: Response) => {
    try {
        const merchantId = req.user?.merchantId || req.user?.userId;

        const campaigns = await prisma.emailCampaign.findMany({
            where: { merchantId },
            include: {
                segment: {
                    select: {
                        name: true,
                        _count: {
                            select: { customers: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(campaigns);
    } catch (error: any) {
        console.error('Get campaigns error:', error);
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
};

// Send campaign (PRO only)
export const sendCampaign = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const merchantId = req.user?.merchantId || req.user?.userId;

        const campaign = await prisma.emailCampaign.findFirst({
            where: { id, merchantId },
            include: {
                segment: {
                    include: {
                        customers: {
                            include: {
                                customer: true
                            }
                        }
                    }
                }
            }
        });

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        if (campaign.status === 'SENT') {
            return res.status(400).json({ error: 'Campaign already sent' });
        }

        // Get recipients
        const recipients = campaign.segment?.customers.map(c => c.customer) || [];
        const totalRecipients = recipients.length;

        // Update campaign status
        await prisma.emailCampaign.update({
            where: { id },
            data: {
                status: 'SENDING',
                totalRecipients
            }
        });

        // TODO: Implement actual email sending logic here
        // For now, we'll just mark as sent
        await prisma.emailCampaign.update({
            where: { id },
            data: {
                status: 'SENT',
                sentAt: new Date(),
                sentCount: totalRecipients
            }
        });

        res.json({ message: 'Campaign sent successfully', recipients: totalRecipients });
    } catch (error: any) {
        console.error('Send campaign error:', error);
        res.status(500).json({ error: 'Failed to send campaign' });
    }
};

// Get campaign analytics
export const getCampaignAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const merchantId = req.user?.merchantId || req.user?.userId;

        const campaign = await prisma.emailCampaign.findFirst({
            where: { id, merchantId }
        });

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        const analytics = {
            totalRecipients: campaign.totalRecipients,
            sentCount: campaign.sentCount,
            openedCount: campaign.openedCount,
            clickedCount: campaign.clickedCount,
            openRate: campaign.sentCount > 0 ? (campaign.openedCount / campaign.sentCount) * 100 : 0,
            clickRate: campaign.sentCount > 0 ? (campaign.clickedCount / campaign.sentCount) * 100 : 0
        };

        res.json(analytics);
    } catch (error: any) {
        console.error('Get campaign analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch campaign analytics' });
    }
};

// Helper function to apply segment criteria
async function applySegmentCriteria(segmentId: string, merchantId: string, criteria: any) {
    try {
        // Build where clause based on criteria
        const where: any = { merchantId };

        if (criteria.status) {
            where.status = criteria.status;
        }

        if (criteria.minLifetimeValue) {
            where.lifetimeValue = { gte: criteria.minLifetimeValue };
        }

        if (criteria.minPurchases) {
            where.totalPurchases = { gte: criteria.minPurchases };
        }

        // Get matching customers
        const customers = await prisma.customer.findMany({
            where,
            select: { id: true }
        });

        // Add customers to segment
        if (customers.length > 0) {
            await prisma.customerSegmentRelation.createMany({
                data: customers.map(c => ({
                    customerId: c.id,
                    segmentId
                })),
                skipDuplicates: true
            });
        }
    } catch (error) {
        console.error('Apply segment criteria error:', error);
    }
}
