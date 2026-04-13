"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCampaignAnalytics = exports.sendCampaign = exports.getCampaigns = exports.createCampaign = exports.getSegmentCustomers = exports.getSegments = exports.createSegment = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createSegment = async (req, res) => {
    try {
        const merchantId = req.user?.merchantId || req.user?.userId;
        const { name, description, criteria, autoUpdate } = req.body;
        if (!name || !criteria) {
            return res.status(400).json({ error: 'Segment name and criteria are required' });
        }
        const segment = await prisma.customerSegment.create({
            data: {
                merchantId: merchantId,
                name,
                description,
                criteria: JSON.stringify(criteria),
                autoUpdate: autoUpdate !== false
            }
        });
        await applySegmentCriteria(segment.id, merchantId, criteria);
        res.status(201).json(segment);
    }
    catch (error) {
        console.error('Create segment error:', error);
        res.status(500).json({ error: 'Failed to create segment' });
    }
};
exports.createSegment = createSegment;
const getSegments = async (req, res) => {
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
    }
    catch (error) {
        console.error('Get segments error:', error);
        res.status(500).json({ error: 'Failed to fetch segments' });
    }
};
exports.getSegments = getSegments;
const getSegmentCustomers = async (req, res) => {
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
    }
    catch (error) {
        console.error('Get segment customers error:', error);
        res.status(500).json({ error: 'Failed to fetch segment customers' });
    }
};
exports.getSegmentCustomers = getSegmentCustomers;
const createCampaign = async (req, res) => {
    try {
        const merchantId = req.user?.merchantId || req.user?.userId;
        const { name, subject, content, segmentId, scheduledAt } = req.body;
        if (!name || !subject || !content) {
            return res.status(400).json({ error: 'Campaign name, subject, and content are required' });
        }
        const campaign = await prisma.emailCampaign.create({
            data: {
                merchantId: merchantId,
                name,
                subject,
                content,
                segmentId,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                status: scheduledAt ? 'SCHEDULED' : 'DRAFT'
            }
        });
        res.status(201).json(campaign);
    }
    catch (error) {
        console.error('Create campaign error:', error);
        res.status(500).json({ error: 'Failed to create campaign' });
    }
};
exports.createCampaign = createCampaign;
const getCampaigns = async (req, res) => {
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
    }
    catch (error) {
        console.error('Get campaigns error:', error);
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
};
exports.getCampaigns = getCampaigns;
const sendCampaign = async (req, res) => {
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
        const recipients = campaign.segment?.customers.map(c => c.customer) || [];
        const totalRecipients = recipients.length;
        await prisma.emailCampaign.update({
            where: { id },
            data: {
                status: 'SENDING',
                totalRecipients
            }
        });
        await prisma.emailCampaign.update({
            where: { id },
            data: {
                status: 'SENT',
                sentAt: new Date(),
                sentCount: totalRecipients
            }
        });
        res.json({ message: 'Campaign sent successfully', recipients: totalRecipients });
    }
    catch (error) {
        console.error('Send campaign error:', error);
        res.status(500).json({ error: 'Failed to send campaign' });
    }
};
exports.sendCampaign = sendCampaign;
const getCampaignAnalytics = async (req, res) => {
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
    }
    catch (error) {
        console.error('Get campaign analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch campaign analytics' });
    }
};
exports.getCampaignAnalytics = getCampaignAnalytics;
async function applySegmentCriteria(segmentId, merchantId, criteria) {
    try {
        const where = { merchantId };
        if (criteria.status) {
            where.status = criteria.status;
        }
        if (criteria.minLifetimeValue) {
            where.lifetimeValue = { gte: criteria.minLifetimeValue };
        }
        if (criteria.minPurchases) {
            where.totalPurchases = { gte: criteria.minPurchases };
        }
        const customers = await prisma.customer.findMany({
            where,
            select: { id: true }
        });
        if (customers.length > 0) {
            await prisma.customerSegmentRelation.createMany({
                data: customers.map(c => ({
                    customerId: c.id,
                    segmentId
                })),
                skipDuplicates: true
            });
        }
    }
    catch (error) {
        console.error('Apply segment criteria error:', error);
    }
}
//# sourceMappingURL=crm-pro.controller.js.map
