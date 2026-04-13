"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTeamMember = exports.updateTeamMember = exports.createTeamMember = exports.getTeamMembers = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const createBranchManagerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    phoneNumber: zod_1.z.string().min(10),
    password: zod_1.z.string().min(6)
});
const updateBranchManagerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    status: zod_1.z.enum(['ACTIVE', 'SUSPENDED']).optional()
});
const getTeamMembers = async (req, res) => {
    try {
        const userId = req.user.userId;
        const merchantId = req.user.merchantId;
        if (userId !== merchantId) {
            return res.status(403).json({ error: 'Only the account owner can view branch managers' });
        }
        const branchManagers = await prisma.user.findMany({
            where: { parentId: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                role: true,
                status: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(branchManagers);
    }
    catch (error) {
        console.error("Get Branch Managers Error:", error);
        res.status(500).json({ error: 'Failed to fetch branch managers' });
    }
};
exports.getTeamMembers = getTeamMembers;
const createTeamMember = async (req, res) => {
    try {
        const userId = req.user.userId;
        const merchantId = req.user.merchantId;
        if (userId !== merchantId) {
            return res.status(403).json({ error: 'Only the account owner can add branch managers' });
        }
        const subscription = await prisma.subscription.findUnique({
            where: { merchantId: userId }
        });
        if (!subscription || !['PRO', 'ENTERPRISE'].includes(subscription.plan)) {
            return res.status(403).json({ error: 'Upgrade to PRO plan to add branch managers' });
        }
        const data = createBranchManagerSchema.parse(req.body);
        const existing = await prisma.user.findFirst({
            where: { email: data.email }
        });
        if (existing) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        const existingPhone = await prisma.user.findFirst({
            where: { phoneNumber: data.phoneNumber }
        });
        if (existingPhone) {
            return res.status(400).json({ error: 'User with this phone number already exists' });
        }
        const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
        const branchManager = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                phoneNumber: data.phoneNumber,
                passwordHash,
                role: 'BRANCH_MANAGER',
                status: 'ACTIVE',
                parentId: userId
            },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                role: true,
                status: true,
                createdAt: true
            }
        });
        await prisma.wallet.create({
            data: {
                userId: branchManager.id,
                balance: 0,
                currency: 'KES'
            }
        });
        res.status(201).json(branchManager);
    }
    catch (error) {
        console.error("Create Branch Manager Error:", error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        res.status(500).json({ error: error.message || 'Failed to create branch manager' });
    }
};
exports.createTeamMember = createTeamMember;
const updateTeamMember = async (req, res) => {
    try {
        const userId = req.user.userId;
        const merchantId = req.user.merchantId;
        const { id } = req.params;
        if (userId !== merchantId) {
            return res.status(403).json({ error: 'Only the account owner can update branch managers' });
        }
        const data = updateBranchManagerSchema.parse(req.body);
        const branchManager = await prisma.user.findFirst({
            where: { id, parentId: userId }
        });
        if (!branchManager) {
            return res.status(404).json({ error: 'Branch manager not found' });
        }
        const updated = await prisma.user.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.status && { status: data.status })
            },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                role: true,
                status: true
            }
        });
        res.json(updated);
    }
    catch (error) {
        console.error("Update Branch Manager Error:", error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        res.status(500).json({ error: error.message || 'Failed to update branch manager' });
    }
};
exports.updateTeamMember = updateTeamMember;
const deleteTeamMember = async (req, res) => {
    try {
        const userId = req.user.userId;
        const merchantId = req.user.merchantId;
        const { id } = req.params;
        if (userId !== merchantId) {
            return res.status(403).json({ error: 'Only the account owner can suspend branch managers' });
        }
        const branchManager = await prisma.user.findFirst({
            where: { id, parentId: userId }
        });
        if (!branchManager) {
            return res.status(404).json({ error: 'Branch manager not found' });
        }
        await prisma.user.update({
            where: { id },
            data: { status: 'SUSPENDED' }
        });
        res.json({ message: 'Branch manager suspended successfully' });
    }
    catch (error) {
        console.error("Suspend Branch Manager Error:", error);
        res.status(500).json({ error: 'Failed to suspend branch manager' });
    }
};
exports.deleteTeamMember = deleteTeamMember;
//# sourceMappingURL=team.controller.js.map
