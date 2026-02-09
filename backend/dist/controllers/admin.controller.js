"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerSystemUpdate = exports.getSystemUpdateLogs = exports.getSystemStatus = exports.manageSubscription = exports.resetUserPassword = exports.deleteUser = exports.updateUser = exports.getAdminStats = exports.verifyUser = exports.updateUserStatus = exports.createUser = exports.getAllUsers = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                businessProfile: true,
                _count: {
                    select: {
                        products: true,
                        sales: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAllUsers = getAllUsers;
const createUser = async (req, res) => {
    try {
        const { name, email, phoneNumber, password, role } = req.body;
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { phoneNumber }]
            }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email or phone already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                phoneNumber,
                passwordHash: hashedPassword,
                role: role || 'MERCHANT',
                status: 'ACTIVE',
                wallet: {
                    create: {
                        balance: 0
                    }
                },
                businessProfile: {
                    create: {
                        companyName: `${name}'s Business`
                    }
                }
            }
        });
        res.status(201).json({ message: 'User created successfully', userId: newUser.id });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createUser = createUser;
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        if (!['ACTIVE', 'SUSPENDED', 'REJECTED', 'PENDING_VERIFICATION'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                status,
                appealNotes: notes || null
            }
        });
        res.json({ message: `User status updated to ${status}`, user: updatedUser });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateUserStatus = updateUserStatus;
const verifyUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                emailVerified: true,
                verificationToken: null,
                status: 'ACTIVE'
            }
        });
        res.json({ message: 'User manually verified successfully', user: updatedUser });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.verifyUser = verifyUser;
const getAdminStats = async (req, res) => {
    try {
        const activeMerchants = await prisma.user.count({
            where: { role: 'MERCHANT', status: 'ACTIVE' }
        });
        const totalVolumeAgg = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: { status: 'COMPLETED' }
        });
        const totalVolume = totalVolumeAgg._sum.amount || 0;
        const netIncomeAgg = await prisma.transaction.aggregate({
            _sum: { feeCharged: true },
            where: { status: 'COMPLETED' }
        });
        const netIncome = netIncomeAgg._sum.feeCharged || 0;
        const pendingPayouts = await prisma.withdrawal.count({
            where: { status: 'PENDING' }
        });
        const recentLogs = await prisma.transaction.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                initiator: { select: { name: true, email: true } }
            }
        });
        res.json({
            activeMerchants,
            totalVolume,
            netIncome,
            pendingPayouts,
            recentLogs
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAdminStats = getAdminStats;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phoneNumber, role } = req.body;
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                phoneNumber,
                role
            }
        });
        res.json({ message: 'User updated successfully', user: updatedUser });
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Email or phone number already exists' });
        }
        res.status(500).json({ error: error.message });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user?.userId === id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        await prisma.$transaction(async (tx) => {
            await tx.businessProfile.deleteMany({
                where: { userId: id }
            });
            const wallet = await tx.wallet.findUnique({
                where: { userId: id }
            });
            if (wallet) {
                await tx.withdrawal.deleteMany({
                    where: { walletId: wallet.id }
                });
                await tx.transaction.deleteMany({
                    where: {
                        recipientWalletId: wallet.id
                    }
                });
                await tx.wallet.delete({
                    where: { id: wallet.id }
                });
            }
            const sales = await tx.sale.findMany({
                where: { merchantId: id }
            });
            for (const sale of sales) {
                await tx.saleItem.deleteMany({
                    where: { saleId: sale.id }
                });
            }
            await tx.sale.deleteMany({
                where: { merchantId: id }
            });
            await tx.product.deleteMany({
                where: { merchantId: id }
            });
            await tx.category.deleteMany({
                where: { merchantId: id }
            });
            await tx.subscription.deleteMany({
                where: { merchantId: id }
            });
            await tx.user.delete({
                where: { id }
            });
        });
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete user' });
    }
};
exports.deleteUser = deleteUser;
const resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        await prisma.user.update({
            where: { id },
            data: {
                passwordHash: hashedPassword
            }
        });
        res.json({ message: 'Password reset successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.resetUserPassword = resetUserPassword;
const manageSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const { plan, extendDays, action } = req.body;
        console.log(`👮 [ADMIN] Managing Subscription for Target User: ${id}`);
        console.log(`   > Action: ${action} | Plan: ${plan} | Extend: ${extendDays}`);
        const transaction = await prisma.$transaction(async (tx) => {
            let sub = await tx.subscription.findUnique({ where: { merchantId: id } });
            if (action === 'SET_PLAN') {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 30);
                if (plan === 'NONE') {
                    if (sub) {
                        await tx.subscription.delete({ where: { merchantId: id } });
                    }
                    return null;
                }
                sub = await tx.subscription.upsert({
                    where: { merchantId: id },
                    update: {
                        plan,
                        status: 'ACTIVE',
                        startDate: new Date(),
                        endDate,
                    },
                    create: {
                        merchantId: id,
                        plan,
                        status: 'ACTIVE',
                        startDate: new Date(),
                        endDate,
                        features: '[]'
                    }
                });
            }
            else if (action === 'EXTEND') {
                if (!sub)
                    throw new Error("User has no active subscription to extend");
                const currentEnd = sub.endDate ? new Date(sub.endDate) : new Date();
                const baseDate = currentEnd < new Date() ? new Date() : currentEnd;
                const newEndDate = new Date(baseDate);
                newEndDate.setDate(newEndDate.getDate() + Number(extendDays));
                sub = await tx.subscription.update({
                    where: { merchantId: id },
                    data: {
                        endDate: newEndDate,
                        status: 'ACTIVE'
                    }
                });
            }
            return sub;
        });
        res.json({ message: 'Subscription updated successfully', subscription: transaction });
    }
    catch (error) {
        console.error("Manage Subscription Error:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.manageSubscription = manageSubscription;
const getSystemStatus = async (req, res) => {
    try {
        (0, child_process_1.exec)('git rev-parse --short HEAD', (error, stdout, stderr) => {
            if (error) {
                console.error('Git Error:', error);
                return res.json({ version: 'Unknown', lastUpdate: new Date() });
            }
            res.json({
                version: stdout.trim(),
                lastUpdate: new Date(),
                status: 'ONLINE'
            });
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getSystemStatus = getSystemStatus;
let updateState = {
    isUpdating: false,
    logs: []
};
const getSystemUpdateLogs = async (req, res) => {
    res.json(updateState);
};
exports.getSystemUpdateLogs = getSystemUpdateLogs;
const triggerSystemUpdate = async (req, res) => {
    try {
        if (updateState.isUpdating) {
            return res.status(400).json({ error: 'Update already in progress' });
        }
        const updateScript = path_1.default.join(process.cwd(), '../update.sh');
        const projectRoot = path_1.default.join(process.cwd(), '../');
        console.log(`Triggering update via: ${updateScript} from ${projectRoot}`);
        updateState.isUpdating = true;
        updateState.logs = [`🚀 Starting System Update at ${new Date().toISOString()}...`];
        const child = (0, child_process_1.spawn)('bash', [updateScript], { cwd: projectRoot });
        child.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach((line) => {
                if (line.trim()) {
                    console.log(`[UPDATE] ${line}`);
                    updateState.logs.push(line.trim());
                }
            });
        });
        child.stderr.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach((line) => {
                if (line.trim()) {
                    console.error(`[UPDATE ERROR] ${line}`);
                    updateState.logs.push(`ERR: ${line.trim()}`);
                }
            });
        });
        child.on('close', (code) => {
            console.log(`Update process exited with code ${code}`);
            updateState.isUpdating = false;
            updateState.logs.push(`🏁 Update Process Finished with code ${code}`);
            if (code === 0) {
                updateState.logs.push(`✅ SUCCESS. Refresh page to see changes.`);
            }
            else {
                updateState.logs.push(`❌ FAILED. Check logs above.`);
            }
        });
        res.json({ message: 'System update initiated. Check logs for progress.' });
    }
    catch (error) {
        updateState.isUpdating = false;
        res.status(500).json({ error: error.message });
    }
};
exports.triggerSystemUpdate = triggerSystemUpdate;
//# sourceMappingURL=admin.controller.js.map