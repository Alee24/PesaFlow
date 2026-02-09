import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSystemEmail } from '../services/email.service';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

// Create Ticket
export const createTicket = async (req: AuthRequest, res: Response) => {
    try {
        const { subject, priority, message } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Create Ticket + First Message
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

        // Notify Admin (Placeholders for now)
        try {
            await sendSystemEmail(
                process.env.ADMIN_EMAIL || 'admin@mpesaconnect.co.ke',
                `New Ticket: ${ticket.subject}`,
                `<h3>New Ticket Created</h3><p><strong>User ID:</strong> ${userId}</p><p><strong>Subject:</strong> ${ticket.subject}</p><p><strong>Priority:</strong> ${priority}</p><p><strong>Message:</strong></p><pre>${message}</pre>`
            );
        } catch (emailError) {
            console.error('Failed to send admin notification', emailError);
        }

        res.status(201).json(ticket);
    } catch (error) {
        console.error('Error creating ticket:', error);
        // Log inner error if available
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        res.status(500).json({ error: 'Failed to create ticket', details: (error as any).message });
    }
};

// Get User Tickets
export const getTickets = async (req: AuthRequest, res: Response) => {
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
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
};

// Get Single Ticket details
export const getTicket = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
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
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch ticket' });
    }
};

// Reply to Ticket
export const replyTicket = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
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
                senderId: userId!,
                message,
                isAdmin: req.user?.role === 'ADMIN'
            }
        });

        await prisma.ticket.update({
            where: { id },
            data: { status: 'OPEN', updatedAt: new Date() } // Re-open or bump
        });

        // Notify Admin
        // Notify Admin
        try {
            await sendSystemEmail(
                process.env.ADMIN_EMAIL || 'admin@mpesaconnect.co.ke',
                `Ticket Reply: ${ticket.subject}`,
                `<h3>New Reply from User</h3><p><strong>Ticket ID:</strong> ${id}</p><p><strong>Message:</strong></p><pre>${message}</pre>`
            );
        } catch (e) { }

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ error: 'Failed to reply' });
    }
};
