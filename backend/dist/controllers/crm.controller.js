"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocument = exports.uploadDocument = exports.addInteraction = exports.addNote = exports.getCustomerStats = exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomer = exports.getCustomers = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getCustomers = async (req, res) => {
    try {
        const merchantId = req.user?.merchantId || req.user?.userId;
        const { search, status, page = 1, limit = 20 } = req.query;
        const where = { merchantId };
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } },
                { company: { contains: search } }
            ];
        }
        if (status) {
            where.status = status;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                include: {
                    tags: {
                        include: {
                            tag: true
                        }
                    },
                    _count: {
                        select: {
                            notes: true,
                            interactions: true,
                            sales: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.customer.count({ where })
        ]);
        res.json({
            customers,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
};
exports.getCustomers = getCustomers;
const getCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const merchantId = req.user?.merchantId || req.user?.userId;
        const customer = await prisma.customer.findFirst({
            where: { id, merchantId },
            include: {
                notes: {
                    include: {
                        user: {
                            select: { name: true, email: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                interactions: {
                    include: {
                        user: {
                            select: { name: true, email: true }
                        }
                    },
                    orderBy: { interactionDate: 'desc' }
                },
                tags: {
                    include: {
                        tag: true
                    }
                },
                segments: {
                    include: {
                        segment: true
                    }
                },
                sales: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                },
                documents: {
                    include: {
                        user: {
                            select: { name: true, email: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const stats = await prisma.sale.groupBy({
            by: ['paymentStatus'],
            where: { customerId: id },
            _sum: {
                totalAmount: true,
                amountPaid: true,
                amountDue: true
            },
            _count: {
                id: true
            }
        });
        const billingStats = {
            totalPaid: 0,
            totalPending: 0,
            totalCanceled: 0,
            countPaid: 0,
            countPending: 0,
            countCanceled: 0
        };
        stats.forEach(group => {
            const amount = Number(group._sum.totalAmount || 0);
            const paid = Number(group._sum.amountPaid || 0);
            const due = Number(group._sum.amountDue || 0);
            const count = group._count.id;
            if (group.paymentStatus === 'PAID') {
                billingStats.totalPaid += amount;
                billingStats.countPaid += count;
            }
            else if (group.paymentStatus === 'PENDING' || group.paymentStatus === 'PARTIAL') {
                billingStats.totalPaid += paid;
                billingStats.totalPending += due;
                billingStats.countPending += count;
            }
            else if (group.paymentStatus === 'CANCELED' || group.paymentStatus === 'CANCELLED') {
                billingStats.totalCanceled += amount;
                billingStats.countCanceled += count;
            }
        });
        res.json({
            ...customer,
            billingStats
        });
    }
    catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
};
exports.getCustomer = getCustomer;
const createCustomer = async (req, res) => {
    try {
        const merchantId = req.user?.merchantId || req.user?.userId;
        const { name, email, phone, company, address, city, country, source, status } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Customer name is required' });
        }
        const customer = await prisma.customer.create({
            data: {
                merchantId: merchantId,
                name,
                email,
                phone,
                company,
                address,
                city,
                country,
                source,
                status
            }
        });
        res.status(201).json(customer);
    }
    catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
};
exports.createCustomer = createCustomer;
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const merchantId = req.user?.merchantId || req.user?.userId;
        const { name, email, phone, company, address, city, country, status } = req.body;
        const customer = await prisma.customer.findFirst({
            where: { id, merchantId }
        });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const updated = await prisma.customer.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                company,
                address,
                city,
                country,
                status
            }
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
};
exports.updateCustomer = updateCustomer;
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const merchantId = req.user?.merchantId || req.user?.userId;
        const customer = await prisma.customer.findFirst({
            where: { id, merchantId }
        });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        await prisma.customer.delete({ where: { id } });
        res.json({ message: 'Customer deleted successfully' });
    }
    catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
};
exports.deleteCustomer = deleteCustomer;
const getCustomerStats = async (req, res) => {
    try {
        const merchantId = req.user?.merchantId || req.user?.userId;
        const [total, active, leads, highValue] = await Promise.all([
            prisma.customer.count({ where: { merchantId } }),
            prisma.customer.count({ where: { merchantId, status: 'ACTIVE' } }),
            prisma.customer.count({ where: { merchantId, status: 'LEAD' } }),
            prisma.customer.count({
                where: {
                    merchantId,
                    lifetimeValue: { gte: 10000 }
                }
            })
        ]);
        const totalLifetimeValue = await prisma.customer.aggregate({
            where: { merchantId },
            _sum: { lifetimeValue: true }
        });
        res.json({
            total,
            active,
            leads,
            highValue,
            totalLifetimeValue: totalLifetimeValue._sum.lifetimeValue || 0
        });
    }
    catch (error) {
        console.error('Get customer stats error:', error);
        res.status(500).json({ error: 'Failed to fetch customer stats' });
    }
};
exports.getCustomerStats = getCustomerStats;
const addNote = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const merchantId = req.user?.merchantId || req.user?.userId;
        const { content, type } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Note content is required' });
        }
        const customer = await prisma.customer.findFirst({
            where: { id, merchantId }
        });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const note = await prisma.customerNote.create({
            data: {
                customerId: id,
                userId: userId,
                content,
                type: type || 'NOTE'
            },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });
        res.status(201).json(note);
    }
    catch (error) {
        console.error('Add note error:', error);
        res.status(500).json({ error: 'Failed to add note' });
    }
};
exports.addNote = addNote;
const addInteraction = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const merchantId = req.user?.merchantId || req.user?.userId;
        const { type, subject, description, outcome, duration, interactionDate } = req.body;
        if (!type) {
            return res.status(400).json({ error: 'Interaction type is required' });
        }
        const customer = await prisma.customer.findFirst({
            where: { id, merchantId }
        });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const interaction = await prisma.customerInteraction.create({
            data: {
                customerId: id,
                userId: userId,
                type,
                subject,
                description,
                outcome,
                duration,
                interactionDate: interactionDate ? new Date(interactionDate) : new Date()
            },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });
        res.status(201).json(interaction);
    }
    catch (error) {
        console.error('Add interaction error:', error);
        res.status(500).json({ error: 'Failed to add interaction' });
    }
};
exports.addInteraction = addInteraction;
const uploadDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const merchantId = req.user?.merchantId || req.user?.userId;
        const file = req.file;
        const { title, description } = req.body;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        if (file.size > 25 * 1024 * 1024) {
            return res.status(400).json({ error: 'File size exceeds 25MB limit' });
        }
        const customer = await prisma.customer.findFirst({
            where: { id, merchantId }
        });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const document = await prisma.customerDocument.create({
            data: {
                customerId: id,
                userId: userId,
                title: title || file.originalname,
                fileUrl: `/uploads/${file.filename}`,
                fileType: file.mimetype,
                fileSize: file.size,
                description
            },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });
        res.status(201).json(document);
    }
    catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
};
exports.uploadDocument = uploadDocument;
const deleteDocument = async (req, res) => {
    try {
        const { id, documentId } = req.params;
        const merchantId = req.user?.merchantId || req.user?.userId;
        const customer = await prisma.customer.findFirst({
            where: { id, merchantId }
        });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const document = await prisma.customerDocument.findFirst({
            where: { id: documentId, customerId: id }
        });
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '../../public', document.fileUrl);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            }
            catch (err) {
                console.error('Failed to delete physical file:', err);
            }
        }
        await prisma.customerDocument.delete({
            where: { id: documentId }
        });
        res.json({ message: 'Document deleted successfully' });
    }
    catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
};
exports.deleteDocument = deleteDocument;
//# sourceMappingURL=crm.controller.js.map