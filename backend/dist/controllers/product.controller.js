"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importProducts = exports.getInventoryStats = exports.getStockMovements = exports.adjustStock = exports.deleteProduct = exports.updateProduct = exports.getProductById = exports.createProduct = exports.getProducts = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const fs_1 = __importDefault(require("fs"));
const csv_parse_1 = require("csv-parse");
const merchant_hierarchy_1 = require("../utils/merchant-hierarchy");
const prisma = new client_1.PrismaClient();
const productSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    price: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().min(0)),
    costPrice: zod_1.z.preprocess((val) => val ? Number(val) : undefined, zod_1.z.number().optional()),
    stockQuantity: zod_1.z.preprocess((val) => val ? Number(val) : 0, zod_1.z.number().default(0)),
    minStockLevel: zod_1.z.preprocess((val) => val ? Number(val) : 0, zod_1.z.number().default(0)),
    maxStockLevel: zod_1.z.preprocess((val) => val ? Number(val) : null, zod_1.z.number().nullable().optional()),
    reorderPoint: zod_1.z.preprocess((val) => val ? Number(val) : 10, zod_1.z.number().default(10)),
    reorderQuantity: zod_1.z.preprocess((val) => val ? Number(val) : null, zod_1.z.number().nullable().optional()),
    sku: zod_1.z.string().optional(),
    barcode: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().optional().nullable().transform(val => val === '' ? null : val),
    isTaxable: zod_1.z.preprocess((val) => val === 'true' || val === true, zod_1.z.boolean()).default(false),
    taxRate: zod_1.z.preprocess((val) => val ? Number(val) : 0, zod_1.z.number().default(0)),
    unit: zod_1.z.string().optional().default('pcs'),
    supplierName: zod_1.z.string().optional(),
    supplierContact: zod_1.z.string().optional(),
    batchNumber: zod_1.z.string().optional(),
    expiryDate: zod_1.z.string().optional().nullable(),
});
async function createStockMovement(productId, merchantId, type, quantity, previousStock, newStock, reason, reference, notes) {
    await prisma.stockMovement.create({
        data: {
            productId,
            merchantId,
            type,
            quantity,
            previousStock,
            newStock,
            reason,
            reference,
            notes
        }
    });
}
const getProducts = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { status, lowStock, search } = req.query;
        const parentMerchantId = (0, merchant_hierarchy_1.getParentMerchantId)(req.user.userId, req.user.parentId);
        const where = {
            merchantId: parentMerchantId,
        };
        if (status && status !== 'ALL') {
            where.status = status;
        }
        else {
            where.status = { not: 'ARCHIVED' };
        }
        if (lowStock === 'true') {
            where.stockQuantity = { lte: prisma.product.fields.reorderPoint };
        }
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { sku: { contains: search } },
                { barcode: { contains: search } }
            ];
        }
        const products = await prisma.product.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                category: true,
                _count: {
                    select: {
                        stockMovements: true
                    }
                }
            }
        });
        const productsWithAlerts = products.map(product => ({
            ...product,
            isLowStock: product.stockQuantity <= product.reorderPoint,
            isOutOfStock: product.stockQuantity === 0
        }));
        res.json(productsWithAlerts);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};
exports.getProducts = getProducts;
const createProduct = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        let rawData = { ...req.body };
        if (req.file) {
            rawData.imageUrl = `/uploads/${req.file.filename}`;
        }
        const data = productSchema.parse(rawData);
        if (!data.barcode) {
            const uniqueSuffix = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
            data.barcode = `200${uniqueSuffix}`;
        }
        const product = await prisma.product.create({
            data: {
                ...data,
                merchantId: req.user.userId,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
            },
            include: { category: true }
        });
        if (product.stockQuantity > 0) {
            await createStockMovement(product.id, req.user.userId, 'IN', product.stockQuantity, 0, product.stockQuantity, 'Initial stock', undefined, 'Product created with initial stock');
        }
        res.status(201).json(product);
    }
    catch (error) {
        console.error(error);
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        res.status(500).json({ error: 'Failed to create product' });
    }
};
exports.createProduct = createProduct;
const getProductById = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const product = await prisma.product.findFirst({
            where: {
                id,
                merchantId: req.user.userId
            },
            include: {
                category: true,
                stockMovements: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        });
        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        res.json(product);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};
exports.getProductById = getProductById;
const updateProduct = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const existing = await prisma.product.findFirst({
            where: { id, merchantId: req.user.userId }
        });
        if (!existing) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        let rawData = { ...req.body };
        if (req.file) {
            rawData.imageUrl = `/uploads/${req.file.filename}`;
        }
        const data = productSchema.partial().parse(rawData);
        const stockChanged = data.stockQuantity !== undefined && data.stockQuantity !== existing.stockQuantity;
        const product = await prisma.product.update({
            where: { id },
            data: {
                ...data,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
            },
            include: { category: true }
        });
        if (stockChanged && data.stockQuantity !== undefined) {
            const diff = data.stockQuantity - existing.stockQuantity;
            await createStockMovement(product.id, req.user.userId, diff > 0 ? 'IN' : 'OUT', Math.abs(diff), existing.stockQuantity, data.stockQuantity, 'Manual adjustment', undefined, 'Stock updated via product edit');
        }
        res.json(product);
    }
    catch (error) {
        console.error(error);
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        res.status(500).json({ error: 'Failed to update product' });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const product = await prisma.product.findFirst({
            where: { id, merchantId: req.user.userId }
        });
        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        await prisma.product.update({
            where: { id },
            data: { status: 'ARCHIVED' }
        });
        res.json({ message: 'Product archived successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};
exports.deleteProduct = deleteProduct;
const adjustStock = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const { quantity, type, reason, notes } = req.body;
        if (!quantity || !type) {
            res.status(400).json({ error: 'Quantity and type are required' });
            return;
        }
        const product = await prisma.product.findFirst({
            where: { id, merchantId: req.user.userId }
        });
        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        let newStock = product.stockQuantity;
        if (type === 'IN') {
            newStock += quantity;
        }
        else if (type === 'OUT') {
            newStock -= quantity;
            if (newStock < 0)
                newStock = 0;
        }
        else if (type === 'ADJUSTMENT') {
            newStock = quantity;
        }
        const updated = await prisma.product.update({
            where: { id },
            data: {
                stockQuantity: newStock,
                status: newStock === 0 ? 'OUT_OF_STOCK' : 'ACTIVE'
            }
        });
        await createStockMovement(id, req.user.userId, type, Math.abs(newStock - product.stockQuantity), product.stockQuantity, newStock, reason, undefined, notes);
        res.json(updated);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to adjust stock' });
    }
};
exports.adjustStock = adjustStock;
const getStockMovements = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { productId, type, limit = 50 } = req.query;
        const where = {
            merchantId: req.user.userId
        };
        if (productId) {
            where.productId = productId;
        }
        if (type) {
            where.type = type;
        }
        const movements = await prisma.stockMovement.findMany({
            where,
            include: {
                product: {
                    select: {
                        name: true,
                        sku: true,
                        barcode: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit)
        });
        res.json(movements);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stock movements' });
    }
};
exports.getStockMovements = getStockMovements;
const getInventoryStats = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const products = await prisma.product.findMany({
            where: {
                merchantId: req.user.merchantId,
                status: { not: 'ARCHIVED' }
            }
        });
        const totalProducts = products.length;
        const lowStockItems = products.filter(p => p.stockQuantity <= p.reorderPoint).length;
        const outOfStockItems = products.filter(p => p.stockQuantity === 0).length;
        const totalValue = products.reduce((sum, p) => {
            return sum + (Number(p.price) * p.stockQuantity);
        }, 0);
        const totalCost = products.reduce((sum, p) => {
            return sum + (Number(p.costPrice || 0) * p.stockQuantity);
        }, 0);
        res.json({
            totalProducts,
            lowStockItems,
            outOfStockItems,
            totalValue,
            totalCost,
            estimatedProfit: totalValue - totalCost
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch inventory stats' });
    }
};
exports.getInventoryStats = getInventoryStats;
const importProducts = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!req.file) {
            res.status(400).json({ error: 'No CSV file uploaded' });
            return;
        }
        const results = [];
        const processFile = () => new Promise((resolve, reject) => {
            fs_1.default.createReadStream(req.file.path)
                .pipe((0, csv_parse_1.parse)({ columns: true, skip_empty_lines: true }))
                .on('data', (data) => results.push(data))
                .on('error', (err) => reject(err))
                .on('end', () => resolve());
        });
        await processFile();
        let successCount = 0;
        let errorCount = 0;
        for (const item of results) {
            try {
                let categoryId = null;
                if (item.category) {
                    const cleanCat = item.category.trim();
                    let category = await prisma.category.findFirst({
                        where: { name: cleanCat, merchantId: req.user.merchantId }
                    });
                    if (!category) {
                        category = await prisma.category.create({
                            data: { name: cleanCat, merchantId: req.user.merchantId }
                        });
                    }
                    categoryId = category.id;
                }
                await prisma.product.create({
                    data: {
                        name: item.name || 'Untitled Product',
                        price: Number(item.price) || 0,
                        costPrice: Number(item.costPrice) || 0,
                        stockQuantity: Number(item.stock) || 0,
                        sku: item.sku || undefined,
                        barcode: item.barcode || undefined,
                        description: item.description || '',
                        merchantId: req.user.userId,
                        categoryId: categoryId,
                        unit: item.unit || 'pcs'
                    }
                });
                successCount++;
            }
            catch (err) {
                console.error("Row Import Failed:", err);
                errorCount++;
            }
        }
        fs_1.default.unlinkSync(req.file.path);
        res.json({
            message: 'Import processed',
            stats: {
                total: results.length,
                success: successCount,
                failed: errorCount
            }
        });
    }
    catch (error) {
        console.error("Import Error:", error);
        res.status(500).json({ error: 'Failed to process import' });
    }
};
exports.importProducts = importProducts;
//# sourceMappingURL=product.controller.js.map
