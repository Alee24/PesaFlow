"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEATURE_ACCESS = exports.checkBranchLimit = exports.incrementTransactionCount = exports.checkTransactionLimit = exports.requireFeature = void 0;
exports.getMinimumPlan = getMinimumPlan;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const FEATURE_ACCESS = {
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
exports.FEATURE_ACCESS = FEATURE_ACCESS;
function getMinimumPlan(feature) {
    return 'FREE';
}
const requireFeature = (feature) => {
    return async (req, res, next) => {
        next();
    };
};
exports.requireFeature = requireFeature;
const checkTransactionLimit = async (req, res, next) => {
    next();
};
exports.checkTransactionLimit = checkTransactionLimit;
const incrementTransactionCount = async (merchantId) => {
    return;
};
exports.incrementTransactionCount = incrementTransactionCount;
const checkBranchLimit = async (req, res, next) => {
    next();
};
exports.checkBranchLimit = checkBranchLimit;
//# sourceMappingURL=subscription.middleware.js.map