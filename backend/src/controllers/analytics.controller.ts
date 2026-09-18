import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const trackVisit = async (req: Request, res: Response) => {
    try {
        const { sessionId, path, timeSpent = 0 } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';

        // Extremely basic IP-based location inference or rely on a geo library
        // Since we don't have a geo library, we'll store IP for now
        let location = 'Unknown';
        
        // Find existing session on this path
        const existing = await prisma.siteVisit.findFirst({
            where: {
                sessionId,
                path
            }
        });

        if (existing) {
            await prisma.siteVisit.update({
                where: { id: existing.id },
                data: {
                    timeSpent: existing.timeSpent + timeSpent,
                    updatedAt: new Date()
                }
            });
        } else {
            await prisma.siteVisit.create({
                data: {
                    sessionId,
                    path,
                    ip: Array.isArray(ip) ? ip[0] : ip,
                    userAgent,
                    location,
                    timeSpent
                }
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Track Visit Error:", error);
        res.status(500).json({ error: 'Failed to track visit' });
    }
};

export const getSiteVisitors = async (req: Request, res: Response) => {
    try {
        const userRole = (req as any).user?.role;
        if (userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const visits = await prisma.siteVisit.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 200
        });

        res.json(visits);
    } catch (error) {
        console.error("Get Visitors Error:", error);
        res.status(500).json({ error: 'Failed to fetch visitors' });
    }
};
