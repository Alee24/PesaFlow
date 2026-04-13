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
exports.getStaffPerformance = exports.getSalesStats = exports.getSaleById = exports.getRecentSales = exports.createCashSale = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const saleItemSchema = zod_1.z.object({
    productId: zod_1.z.string(),
    quantity: zod_1.z.number().positive(),
    price: zod_1.z.number().positive(),
    discount: zod_1.z.number().optional().default(0),
    tax: zod_1.z.number().optional().default(0)
});
const saleSchema = zod_1.z.object({
    items: zod_1.z.array(saleItemSchema).min(1),
    customerName: zod_1.z.string().optional(),
    customerPhone: zod_1.z.string().optional(),
    customerEmail: zod_1.z.string().optional(),
    discountType: zod_1.z.enum(['PERCENTAGE', 'FIXED']).optional(),
    discountValue: zod_1.z.number().optional().default(0),
    paymentMethod: zod_1.z.enum(['CASH', 'MPESA_STK', 'SPLIT']).default('CASH'),
    splitPayments: zod_1.z.array(zod_1.z.object({
        method: zod_1.z.string(),
        amount: zod_1.z.number()
    })).optional(),
    amountPaid: zod_1.z.number().optional(),
    notes: zod_1.z.string().optional()
});
async function createStockMovement(tx, productId, merchantId, quantity, previousStock, newStock, saleId) {
    await tx.stockMovement.create({
        data: {
            productId,
            merchantId,
            type: 'OUT',
            quantity,
            previousStock,
            newStock,
            reason: 'Sale',
            reference: saleId,
            notes: 'Stock reduced due to sale'
        }
    });
}
const createCashSale = async (req, res) => {
    try {
        const userId = req.user.userId;
        const merchantId = req.user.merchantId;
        const validatedData = saleSchema.parse(req.body);
        const { items, customerName, customerPhone, customerEmail, discountType, discountValue, paymentMethod, splitPayments, amountPaid, notes } = validatedData;
        const result = await prisma.$transaction(async (tx) => {
            let wallet = await tx.wallet.findUnique({ where: { userId: merchantId } });
            if (!wallet) {
                wallet = await tx.wallet.create({
                    data: {
                        userId: merchantId,
                        balance: 0,
                        currency: 'KES'
                    }
                });
            }
            let subtotal = 0;
            const processedItems = [];
            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId }
                });
                if (!product) {
                    throw new Error(`Product ${item.productId} not found`);
                }
                if (product.stockQuantity < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}`);
                }
                const itemSubtotal = (item.price * item.quantity) - item.discount + item.tax;
                subtotal += itemSubtotal;
                processedItems.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    discount: item.discount,
                    tax: item.tax,
                    subtotal: itemSubtotal,
                    product
                });
            }
            let discountAmount = 0;
            if (discountType && discountValue) {
                if (discountType === 'PERCENTAGE') {
                    discountAmount = (subtotal * discountValue) / 100;
                }
                else {
                    discountAmount = discountValue;
                }
            }
            const taxAmount = processedItems.reduce((sum, item) => sum + item.tax, 0);
            const totalAmount = subtotal - discountAmount;
            const finalAmountPaid = amountPaid || totalAmount;
            const changeGiven = paymentMethod === 'CASH' ? Math.max(0, finalAmountPaid - totalAmount) : 0;
            const amountDue = Math.max(0, totalAmount - finalAmountPaid);
            const paymentStatus = amountDue > 0 ? 'PARTIAL' : 'PAID';
            let transaction = null;
            if (paymentMethod === 'CASH' || (paymentMethod === 'SPLIT' && splitPayments)) {
                transaction = await tx.transaction.create({
                    data: {
                        type: 'SALE_CASH',
                        amount: totalAmount,
                        status: 'COMPLETED',
                        initiatorUserId: userId,
                        recipientWalletId: wallet.id,
                        reference: `CASH-${Date.now()}`,
                        metadata: JSON.stringify({
                            description: 'POS Cash Sale (Not added to wallet)',
                            customerName,
                            items: processedItems.length
                        })
                    }
                });
            }
            const sale = await tx.sale.create({
                data: {
                    merchantId: merchantId,
                    customerName,
                    customerPhone,
                    customerEmail,
                    subtotal,
                    discountType,
                    discountValue,
                    discountAmount,
                    taxAmount,
                    totalAmount,
                    paymentMethod,
                    paymentStatus,
                    amountPaid: finalAmountPaid,
                    amountDue,
                    changeGiven,
                    splitPayments: splitPayments ? JSON.stringify(splitPayments) : null,
                    transactionId: transaction?.id,
                    notes,
                    items: {
                        create: processedItems.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            discount: item.discount,
                            tax: item.tax,
                            subtotal: item.subtotal
                        }))
                    }
                },
                include: {
                    items: {
                        include: { product: true }
                    }
                }
            });
            for (const item of processedItems) {
                const previousStock = item.product.stockQuantity;
                const newStock = previousStock - item.quantity;
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQuantity: newStock,
                        status: newStock === 0 ? 'OUT_OF_STOCK' : 'ACTIVE'
                    }
                });
                await createStockMovement(tx, item.productId, merchantId, item.quantity, previousStock, newStock, sale.id);
            }
            return { sale, changeGiven };
        });
        const { incrementTransactionCount } = await Promise.resolve().then(() => __importStar(require('../middlewares/subscription.middleware')));
        await incrementTransactionCount(merchantId);
        res.json({
            success: true,
            message: 'Sale recorded successfully',
            sale: result.sale,
            changeGiven: result.changeGiven
        });
    }
    catch (error) {
        console.error("Cash Sale Error:", error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: error.message || 'Failed to process sale' });
    }
};
exports.createCashSale = createCashSale;
const getRecentSales = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { limit = 20, status, paymentMethod, startDate, endDate } = req.query;
        let merchantUserIds = [userId];
        if (userRole === 'MERCHANT') {
            const branchUsers = await prisma.user.findMany({
                where: { parentId: userId },
                select: { id: true }
            });
            merchantUserIds = [userId, ...branchUsers.map(u => u.id)];
        }
        const where = {
            merchantId: { in: merchantUserIds }
        };
        if (status) {
            where.paymentStatus = status;
        }
        if (paymentMethod) {
            where.paymentMethod = paymentMethod;
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const sales = await prisma.sale.findMany({
            where,
            include: {
                items: {
                    include: { product: true }
                },
                transaction: true
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit)
        });
        res.json(sales);
    }
    catch (error) {
        console.error("Get Sales Error:", error);
        res.status(500).json({ error: 'Failed to fetch sales history' });
    }
};
exports.getRecentSales = getRecentSales;
const getSaleById = async (req, res) => {
    try {
        const merchantId = req.user.merchantId;
        const { id } = req.params;
        const sale = await prisma.sale.findFirst({
            where: { id, merchantId },
            include: {
                items: {
                    include: { product: true }
                },
                transaction: true
            }
        });
        if (!sale) {
            return res.status(404).json({ error: 'Sale not found' });
        }
        res.json(sale);
    }
    catch (error) {
        console.error("Get Sale Error:", error);
        res.status(500).json({ error: 'Failed to fetch sale details' });
    }
};
exports.getSaleById = getSaleById;
const getSalesStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { startDate, endDate } = req.query;
        let merchantUserIds = [userId];
        if (userRole === 'MERCHANT') {
            const branchUsers = await prisma.user.findMany({
                where: { parentId: userId },
                select: { id: true }
            });
            merchantUserIds = [userId, ...branchUsers.map(u => u.id)];
        }
        const where = { merchantId: { in: merchantUserIds } };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const sales = await prisma.sale.findMany({
            where,
            include: {
                items: true
            }
        });
        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
        const totalDiscount = sales.reduce((sum, sale) => sum + Number(sale.discountAmount), 0);
        const totalTax = sales.reduce((sum, sale) => sum + Number(sale.taxAmount), 0);
        const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
        const paymentMethods = sales.reduce((acc, sale) => {
            acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1;
            return acc;
        }, {});
        const topProducts = await prisma.saleItem.groupBy({
            by: ['productId'],
            where: {
                sale: {
                    merchantId: { in: merchantUserIds }
                }
            },
            _sum: {
                quantity: true,
                subtotal: true
            },
            orderBy: {
                _sum: {
                    quantity: 'desc'
                }
            },
            take: 10
        });
        res.json({
            totalSales,
            totalRevenue,
            totalDiscount,
            totalTax,
            averageSale,
            paymentMethods,
            topProducts
        });
    }
    catch (error) {
        console.error("Sales Stats Error:", error);
        res.status(500).json({ error: 'Failed to fetch sales statistics' });
    }
};
exports.getSalesStats = getSalesStats;
const getStaffPerformance = async (req, res) => {
    try {
        const merchantId = req.user.merchantId;
        console.log(`[Sales] Getting Staff Performance for Merchant: ${merchantId}`);
        const { startDate, endDate } = req.query;
        const where = {
            status: { in: ['COMPLETED'] },
            type: 'SALE_CASH'
        };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const performance = await prisma.transaction.groupBy({
            by: ['initiatorUserId'],
            where: {
                ...where,
                initiatorUserId: { not: null }
            },
            _count: {
                id: true
            },
            _sum: {
                amount: true
            }
        });
        const enrichedPerformance = await Promise.all(performance.map(async (p) => {
            const user = await prisma.user.findUnique({
                where: { id: p.initiatorUserId },
                select: { name: true, email: true, role: true }
            });
            return {
                userId: p.initiatorUserId,
                userName: user?.name || 'Unknown',
                userEmail: user?.email,
                role: user?.role,
                totalSales: p._count.id,
                totalRevenue: p._sum.amount
            };
        }));
        res.json(enrichedPerformance);
    }
    catch (error) {
        console.error("Staff Performance Error:", error);
        res.status(500).json({ error: 'Failed to fetch staff performance' });
    }
};
exports.getStaffPerformance = getStaffPerformance;
//# sourceMappingURL=sales.controller.js.map
