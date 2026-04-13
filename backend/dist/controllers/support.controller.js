"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replyTicket = exports.getTicket = exports.getTickets = exports.createTicket = void 0;
const client_1 = require("@prisma/client");
const email_service_1 = require("../services/email.service");
const prisma = new client_1.PrismaClient();
const createTicket = async (req, res) => {
    try {
        const { subject, priority, message } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const ticket = await prisma.ticket.create({
            data: {
                merchantId: userId,
                subject,
                priority: priority || 'MEDIUM',
                messages: {
                    create: {
                        senderId: userId,
                        message,
                        isAdmin: false
                    }
                }
            },
            include: {
                messages: true
            }
        });
        try {
            await (0, email_service_1.sendSystemEmail)(process.env.ADMIN_EMAIL || 'admin@mpesaconnect.co.ke', `New Ticket: ${ticket.subject}`, `<h3>New Ticket Created</h3><p><strong>User ID:</strong> ${userId}</p><p><strong>Subject:</strong> ${ticket.subject}</p><p><strong>Priority:</strong> ${priority}</p><p><strong>Message:</strong></p><pre>${message}</pre>`);
        }
        catch (emailError) {
            console.error('Failed to send admin notification', emailError);
        }
        res.status(201).json(ticket);
    }
    catch (error) {
        console.error('Error creating ticket:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        res.status(500).json({ error: 'Failed to create ticket', details: error.message });
    }
};
exports.createTicket = createTicket;
const getTickets = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;
        const where = role === 'ADMIN' ? {} : { merchantId: userId };
        const tickets = await prisma.ticket.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: { select: { messages: true } },
                merchant: { select: { name: true, email: true } }
            }
        });
        res.json(tickets);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
};
exports.getTickets = getTickets;
const getTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                messages: {
                    include: { sender: { select: { name: true, role: true } } },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        if (req.user?.role !== 'ADMIN' && ticket.merchantId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json(ticket);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch ticket' });
    }
};
exports.getTicket = getTicket;
const replyTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const userId = req.user?.userId;
        const ticket = await prisma.ticket.findUnique({ where: { id } });
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        if (req.user?.role !== 'ADMIN' && ticket.merchantId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const newMessage = await prisma.ticketMessage.create({
            data: {
                ticketId: id,
                senderId: userId,
                message,
                isAdmin: req.user?.role === 'ADMIN'
            }
        });
        await prisma.ticket.update({
            where: { id },
            data: { status: 'OPEN', updatedAt: new Date() }
        });
        try {
            await (0, email_service_1.sendSystemEmail)(process.env.ADMIN_EMAIL || 'admin@mpesaconnect.co.ke', `Ticket Reply: ${ticket.subject}`, `<h3>New Reply from User</h3><p><strong>Ticket ID:</strong> ${id}</p><p><strong>Message:</strong></p><pre>${message}</pre>`);
        }
        catch (e) { }
        res.status(201).json(newMessage);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to reply' });
    }
};
exports.replyTicket = replyTicket;
//# sourceMappingURL=support.controller.js.map
