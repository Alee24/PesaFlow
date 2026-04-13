"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMerchantUserIds = getMerchantUserIds;
exports.getParentMerchantId = getParentMerchantId;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getMerchantUserIds(userId, role) {
    if (role === 'ADMIN') {
        return [];
    }
    let userIds = [userId];
    if (role === 'MERCHANT') {
        const branches = await prisma.user.findMany({
            where: { parentId: userId },
            select: { id: true }
        });
        userIds = [userId, ...branches.map(b => b.id)];
    }
    return userIds;
}
function getParentMerchantId(userId, parentId) {
    return parentId || userId;
}
//# sourceMappingURL=merchant-hierarchy.js.map
