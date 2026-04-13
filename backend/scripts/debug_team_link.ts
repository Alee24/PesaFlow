
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTeamLinks() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                parentId: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log("--- User Hierarchy Debug ---");
        users.forEach(u => {
            const type = u.parentId ? "SUB-USER" : "MERCHANT";
            console.log(`[${type}] ${u.email} (ID: ${u.id}) -> Parent: ${u.parentId || 'NONE'}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkTeamLinks();
