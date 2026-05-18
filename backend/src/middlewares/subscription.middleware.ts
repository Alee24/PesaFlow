import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './auth.middleware';

const prisma = new PrismaClient();

// Feature access matrix (All features unlocked for all tiers)
const FEATURE_ACCESS: Record<string, Record<string, boolean>> = {
    'invoices': {
        FREE: true,
        BASIC: true,
        PRO: true,
        ENTERPRISE: true
    },
    'withdrawals': {
        FREE: true,
        BASIC: true,
        PRO: true,
        ENTERPRISE: true
    },
    'team': {
        FREE: true,
        BASIC: true,
        PRO: true,
        ENTERPRISE: true
    },
    'analytics': {
        FREE: true,
        BASIC: true,
        PRO: true,
        ENTERPRISE: true
    },
    'reports': {
        FREE: true,
        BASIC: true,
        PRO: true,
        ENTERPRISE: true
    },
    'CRM': {
        FREE: true,
        BASIC: true,
        PRO: true,
        ENTERPRISE: true
    },
    'ADVANCED_CRM': {
        FREE: true,
        BASIC: true,
        PRO: true,
        ENTERPRISE: true
    }
};

// Get minimum plan required for a feature
function getMinimumPlan(feature: string): string {
    return 'FREE';
}

// Middleware to check if user has access to a feature
export const requireFeature = (feature: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        next();
    };
};

// Middleware to check transaction limits (Bypassed)
export const checkTransactionLimit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    next();
};

// Middleware to increment transaction counter after successful sale (Bypassed)
export const incrementTransactionCount = async (merchantId: string): Promise<void> => {
    return;
};

// Check branch limit (Bypassed)
export const checkBranchLimit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    next();
};

export { FEATURE_ACCESS, getMinimumPlan };
