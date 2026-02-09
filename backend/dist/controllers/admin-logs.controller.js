"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemLogs = void 0;
const client_1 = require("@prisma/client");
const child_process_1 = require("child_process");
const util_1 = require("util");
const prisma = new client_1.PrismaClient();
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const getSystemLogs = async (req, res) => {
    try {
        const { stdout } = await execAsync('pm2 logs --lines 50 --nostream --raw');
        const logLines = stdout.split('\n').filter((line) => line.trim());
        const logs = logLines.slice(-50).map((line, index) => {
            const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})/);
            const timestamp = timestampMatch ? new Date(timestampMatch[1]) : new Date();
            return {
                id: index,
                timestamp: timestamp.toISOString(),
                message: line,
                level: line.includes('error') || line.includes('Error') ? 'error' :
                    line.includes('warn') || line.includes('Warning') ? 'warning' : 'info'
            };
        });
        res.json({ logs });
    }
    catch (error) {
        console.error('Failed to fetch PM2 logs:', error);
        res.status(500).json({ error: 'Failed to fetch system logs', logs: [] });
    }
};
exports.getSystemLogs = getSystemLogs;
//# sourceMappingURL=admin-logs.controller.js.map