import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { exec, spawn } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const prisma = new PrismaClient();
const execAsync = promisify(exec);

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

// Get PM2 System Logs
export const getSystemLogs = async (req: AuthRequest, res: Response) => {
    try {
        // Get last 50 lines from PM2 logs
        const { stdout } = await execAsync('pm2 logs --lines 50 --nostream --raw');

        // Parse logs into structured format
        const logLines = stdout.split('\n').filter((line: string) => line.trim());
        const logs = logLines.slice(-50).map((line: string, index: number) => {
            // Try to parse timestamp and message
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
    } catch (error: any) {
        console.error('Failed to fetch PM2 logs:', error);
        res.status(500).json({ error: 'Failed to fetch system logs', logs: [] });
    }
};
