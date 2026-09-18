"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSiteVisitors = exports.trackVisit = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const trackVisit = async (req, res) => {
    try {
        const { sessionId, path, timeSpent = 0 } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';
        let location = 'Unknown';
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
        }
        else {
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
    }
    catch (error) {
        console.error("Track Visit Error:", error);
        res.status(500).json({ error: 'Failed to track visit' });
    }
};
exports.trackVisit = trackVisit;
const getSiteVisitors = async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const visits = await prisma.siteVisit.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 200
        });
        res.json(visits);
    }
    catch (error) {
        console.error("Get Visitors Error:", error);
        res.status(500).json({ error: 'Failed to fetch visitors' });
    }
};
exports.getSiteVisitors = getSiteVisitors;
//# sourceMappingURL=analytics.controller.js.map