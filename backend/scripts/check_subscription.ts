
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    try {
        const users = await prisma.user.findMany({
            include: { subscription: true }
        });

        console.log("Checking User Subscriptions:");
        users.forEach(u => {
            console.log(`User: ${u.email} (${u.role}) - Plan: ${u.subscription?.plan || 'NONE'} - Status: ${u.subscription?.status || 'N/A'}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
