
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        console.log("--- Recent Users ---");
        users.forEach(u => {
            console.log(`User: ${u.email}`);
            console.log(`ID: ${u.id}`);
            console.log(`ParentID: ${u.parentId}`); // Should print ID or null
            console.log(`Role: ${u.role}`);
            console.log("-------------------");
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
