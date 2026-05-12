import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

// ============================================================
// ALL SUBSCRIPTION RESTRICTIONS REMOVED — APP IS 100% FREE
// ============================================================

// requireFeature: always passes through, no checks
export const requireFeature = (feature: string) => {
    return async (_req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
        next();
    };
};

// checkTransactionLimit: always passes through, no limits
export const checkTransactionLimit = async (_req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    next();
};

// incrementTransactionCount: no-op, no counting
export const incrementTransactionCount = async (_merchantId: string): Promise<void> => {
    return;
};

// checkBranchLimit: always passes through, no branch limits
export const checkBranchLimit = async (_req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    next();
};

// Exports kept for import compatibility — always true / Infinity
export const FEATURE_ACCESS: Record<string, Record<string, boolean>> = {};
export const getMinimumPlan = (_feature: string): string => 'FREE';
