"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.createCategory = exports.getCategories = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getCategories = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const categories = await prisma.category.findMany({
            where: { merchantId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });
        res.json(categories);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getCategories = getCategories;
const createCategory = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const { name } = req.body;
        if (!name)
            return res.status(400).json({ error: 'Name is required' });
        const category = await prisma.category.create({
            data: {
                name,
                merchantId: userId
            }
        });
        res.status(201).json(category);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createCategory = createCategory;
const deleteCategory = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category || category.merchantId !== userId) {
            return res.status(404).json({ error: 'Category not found' });
        }
        await prisma.category.delete({ where: { id } });
        res.json({ message: 'Category deleted' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=category.controller.js.map
