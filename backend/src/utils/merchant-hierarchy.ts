import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all user IDs that belong to a merchant's hierarchy
 * For merchants: returns merchant + all branch users
 * For branch managers: returns only their own ID
 * For admins: returns empty array (no filtering needed)
 */
export async function getMerchantUserIds(userId: string, role: string): Promise<string[]> {
    if (role === 'ADMIN') {
        return []; // Admin sees everything, no filter needed
    }

    let userIds = [userId];

    if (role === 'MERCHANT') {
        // Include all branch staff under this merchant
        const branches = await prisma.user.findMany({
            where: { parentId: userId },
            select: { id: true }
        });
        userIds = [userId, ...branches.map(b => b.id)];
    }

    return userIds;
}

/**
 * Get the parent merchant ID for a user
 * For merchants: returns their own ID
 * For branch managers: returns their parent's ID
 */
export function getParentMerchantId(userId: string, parentId: string | null): string {
    return parentId || userId;
}
