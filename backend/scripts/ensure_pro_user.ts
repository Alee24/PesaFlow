
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upgrade() {
    try {
        // Find Metto
        const user = await prisma.user.findFirst({
            where: { email: { contains: 'metto' } } // Assuming mettoalex@gmail.com
        });

        if (!user) {
            console.log("User not found!");
            return;
        }

        console.log(`Found user: ${user.email} (${user.id})`);

        // Check subscription
        const sub = await prisma.subscription.findUnique({
            where: { merchantId: user.id }
        });

        if (sub) {
            console.log(`Existing subscription: ${sub.plan}`);
            if (sub.plan !== 'PRO' && sub.plan !== 'ENTERPRISE') {
                console.log("Upgrading to PRO...");
                await prisma.subscription.update({
                    where: { merchantId: user.id },
                    data: { plan: 'PRO', status: 'ACTIVE' }
                });
            }
        } else {
            console.log("Creating PRO subscription...");
            await prisma.subscription.create({
                data: {
                    merchantId: user.id,
                    plan: 'PRO',
                    status: 'ACTIVE',
                    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                }
            });
        }
        console.log("User is now PRO.");

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

upgrade();
