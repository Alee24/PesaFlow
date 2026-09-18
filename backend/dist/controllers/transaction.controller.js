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
exports.sendReceiptEmail = exports.updateTransactionStatus = exports.getTransactionById = exports.getTransactions = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getTransactions = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { startDate, endDate, status, type, checkoutRequestId } = req.query;
        const where = {};
        if (userRole !== 'ADMIN') {
            const merchantId = req.user.merchantId || userId;
            const userWallets = await prisma.wallet.findMany({
                where: { userId: { in: [userId, merchantId] } },
                select: { id: true }
            });
            const walletIds = userWallets.map(w => w.id);
            where.OR = [
                { initiatorUserId: userId },
                { initiatorUserId: merchantId },
                { recipientWalletId: { in: walletIds } }
            ];
        }
        if (checkoutRequestId) {
            where.checkoutRequestId = String(checkoutRequestId);
        }
        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        else if (startDate) {
            where.createdAt = {
                gte: new Date(startDate)
            };
        }
        if (status && status !== 'ALL') {
            where.status = status;
        }
        if (type && type !== 'ALL') {
            where.type = type;
        }
        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                initiator: { select: { name: true, email: true } },
                sale: {
                    include: {
                        items: {
                            include: {
                                product: {
                                    select: { name: true, sku: true }
                                }
                            }
                        }
                    }
                }
            }
        });
        res.json(transactions);
    }
    catch (error) {
        console.error("Get Transactions Error:", error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
};
exports.getTransactions = getTransactions;
const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: {
                initiator: {
                    include: { businessProfile: true }
                },
                recipientWallet: true,
                sale: {
                    include: {
                        items: {
                            include: { product: true }
                        }
                    }
                }
            }
        });
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        const userId = req.user.userId;
        const userRole = req.user.role;
        if (userRole !== 'ADMIN') {
            const isInitiator = transaction.initiatorUserId === userId;
            const isRecipient = transaction.recipientWallet.userId === userId;
            if (!isInitiator && !isRecipient) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }
        res.json(transaction);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch transaction details' });
    }
};
exports.getTransactionById = getTransactionById;
const updateTransactionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const transaction = await prisma.transaction.update({
            where: { id },
            data: { status },
            include: { initiator: true }
        });
        if ((status === 'COMPLETED' || status === 'PAID') && transaction.type === 'INVOICE') {
            try {
                let metadata = {};
                if (transaction.metadata) {
                    metadata = JSON.parse(transaction.metadata);
                }
                if (metadata.clientEmail) {
                    const { sendEmail } = await Promise.resolve().then(() => __importStar(require('../services/email.service')));
                    const emailHtml = `
                        <h1>Payment Received</h1>
                        <p>Dear ${metadata.clientName || 'Customer'},</p>
                        <p>We verify that we have received your payment of <b>KES ${Number(transaction.amount).toLocaleString()}</b> for Invoice #${transaction.reference}.</p>
                        <p>Status: <b style="color:green">PAID</b></p>
                        <br>
                        <p>Thank you for your business!</p>
                    `;
                    await sendEmail(transaction.initiatorUserId, metadata.clientEmail, `Payment Receipt for Invoice #${transaction.reference}`, emailHtml);
                    if (transaction.initiator?.email) {
                        await sendEmail(transaction.initiatorUserId, transaction.initiator.email, `Invoice Paid: #${transaction.reference}`, `<p>Your invoice #${transaction.reference} has been marked as PAID.</p>`);
                    }
                }
            }
            catch (emailError) {
                console.error("Failed to send payment email:", emailError);
            }
        }
        res.json(transaction);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update transaction status' });
    }
};
exports.updateTransactionStatus = updateTransactionStatus;
const sendReceiptEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const { to } = req.body;
        const file = req.file;
        if (!to || !file) {
            return res.status(400).json({ error: 'Email destination and PDF file are required' });
        }
        const transaction = await prisma.transaction.findUnique({ where: { id } });
        if (!transaction)
            return res.status(404).json({ error: 'Transaction not found' });
        const { sendEmail } = await Promise.resolve().then(() => __importStar(require('../services/email.service')));
        await sendEmail(transaction.recipientWalletId || '', to, `Receipt for your payment (${transaction.reference || id.slice(0, 8)})`, `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Payment Receipt</h2>
                    <p>Thank you for your payment.</p>
                    <p>Please find attached the official receipt for your transaction <strong>${transaction.reference || id.slice(0, 8)}</strong>.</p>
                    <br/>
                    <p>Best regards,<br/>The Team</p>
                </div>
            `, [
            {
                filename: `Receipt_${transaction.reference || id.slice(0, 8)}.pdf`,
                content: file.buffer
            }
        ]);
        res.json({ message: 'Receipt sent successfully' });
    }
    catch (error) {
        console.error('Send receipt email error:', error);
        res.status(500).json({ error: 'Failed to send receipt email' });
    }
};
exports.sendReceiptEmail = sendReceiptEmail;
//# sourceMappingURL=transaction.controller.js.map