"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectWithdrawal = exports.approveWithdrawal = exports.getAllWithdrawals = exports.requestWithdrawal = exports.getWithdrawals = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getWithdrawals = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const wallet = await prisma.wallet.findFirst({ where: { userId: req.user.userId } });
        if (!wallet)
            return res.status(404).json({ error: 'Wallet not found' });
        const withdrawals = await prisma.withdrawal.findMany({
            where: { walletId: wallet.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(withdrawals);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch withdrawals' });
    }
};
exports.getWithdrawals = getWithdrawals;
const requestWithdrawal = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { amount, mpesaNumber } = req.body;
        const requestedAmount = Number(amount);
        if (requestedAmount < 10)
            return res.status(400).json({ error: 'Minimum withdrawal is KES 10' });
        const fee = requestedAmount * 0.02;
        const totalDeduction = requestedAmount + fee;
        const wallet = await prisma.wallet.findFirst({ where: { userId: req.user.userId } });
        if (!wallet)
            return res.status(404).json({ error: 'Wallet not found' });
        if (Number(wallet.balance) < totalDeduction) {
            return res.status(400).json({ error: `Insufficient funds. You need KES ${totalDeduction.toLocaleString()} (including 2% fee).` });
        }
        const withdrawal = await prisma.withdrawal.create({
            data: {
                walletId: wallet.id,
                amount: requestedAmount,
                fee: fee,
                mpesaNumber: mpesaNumber || 'SAME_AS_USER',
                status: 'PENDING'
            }
        });
        await prisma.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: totalDeduction } }
        });
        try {
            const { NotificationDispatcher } = await Promise.resolve().then(() => __importStar(require('../services/notification-dispatcher.service')));
            NotificationDispatcher.dispatch({
                activity: 'WITHDRAWAL_REQUESTED',
                userId: req.user.userId,
                amount: requestedAmount,
                reference: withdrawal.id,
                title: 'Withdrawal Requested',
                message: `Withdrawal request for KES ${requestedAmount.toLocaleString()} submitted to ${mpesaNumber || 'account phone'}.`
            });
        }
        catch (notifErr) {
            console.error('Notification dispatch error:', notifErr);
        }
        res.status(201).json(withdrawal);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to request withdrawal' });
    }
};
exports.requestWithdrawal = requestWithdrawal;
const getAllWithdrawals = async (req, res) => {
    try {
        if (req.user?.role !== 'ADMIN')
            return res.status(403).json({ error: 'Access denied' });
        const withdrawals = await prisma.withdrawal.findMany({
            include: {
                wallet: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, phoneNumber: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(withdrawals);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch withdrawals' });
    }
};
exports.getAllWithdrawals = getAllWithdrawals;
const approveWithdrawal = async (req, res) => {
    try {
        if (req.user?.role !== 'ADMIN')
            return res.status(403).json({ error: 'Access denied' });
        const { id } = req.params;
        const withdrawal = await prisma.withdrawal.findUnique({
            where: { id },
            include: { wallet: true }
        });
        if (!withdrawal || withdrawal.status !== 'PENDING') {
            return res.status(400).json({ error: 'Invalid or already processed withdrawal' });
        }
        await prisma.withdrawal.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                approvedBy: req.user.userId
            }
        });
        await prisma.transaction.create({
            data: {
                type: 'WITHDRAWAL',
                amount: withdrawal.amount,
                feeCharged: withdrawal.fee,
                status: 'COMPLETED',
                initiatorUserId: withdrawal.wallet.userId,
                recipientWalletId: withdrawal.walletId,
                reference: `WD-${withdrawal.id.slice(0, 8).toUpperCase()}`,
                metadata: JSON.stringify({ mpesaNumber: withdrawal.mpesaNumber })
            }
        });
        try {
            const { NotificationDispatcher } = await Promise.resolve().then(() => __importStar(require('../services/notification-dispatcher.service')));
            NotificationDispatcher.dispatch({
                activity: 'WITHDRAWAL_APPROVED',
                userId: withdrawal.wallet.userId,
                amount: Number(withdrawal.amount),
                reference: withdrawal.id,
                title: 'Withdrawal Approved',
                message: `Your withdrawal of KES ${Number(withdrawal.amount).toLocaleString()} has been approved and disbursed.`
            });
        }
        catch (notifErr) {
            console.error('Notification dispatch error:', notifErr);
        }
        res.json({ message: 'Withdrawal approved successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to approve withdrawal' });
    }
};
exports.approveWithdrawal = approveWithdrawal;
const rejectWithdrawal = async (req, res) => {
    try {
        if (req.user?.role !== 'ADMIN')
            return res.status(403).json({ error: 'Access denied' });
        const { id } = req.params;
        const { reason } = req.body;
        const withdrawal = await prisma.withdrawal.findUnique({
            where: { id }
        });
        if (!withdrawal || withdrawal.status !== 'PENDING') {
            return res.status(400).json({ error: 'Invalid withdrawal' });
        }
        const totalRefund = Number(withdrawal.amount) + Number(withdrawal.fee);
        await prisma.withdrawal.update({
            where: { id },
            data: { status: 'REJECTED' }
        });
        await prisma.wallet.update({
            where: { id: withdrawal.walletId },
            data: { balance: { increment: totalRefund } }
        });
        res.json({ message: 'Withdrawal rejected and funds refunded' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to reject withdrawal' });
    }
};
exports.rejectWithdrawal = rejectWithdrawal;
//# sourceMappingURL=withdrawal.controller.js.map