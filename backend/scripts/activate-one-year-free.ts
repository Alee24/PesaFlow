
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting One Year Free Activation ---');

    // Get all subscriptions
    const allSubs = await prisma.subscription.findMany();
    console.log(`Found ${allSubs.length} subscriptions to check.`);

    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    let updatedCount = 0;

    for (const sub of allSubs) {
        // If it's a FREE plan, make it full access for a year
        if (sub.plan === 'FREE') {
            await prisma.subscription.update({
                where: { id: sub.id },
                data: {
                    endDate: oneYearFromNow,
                    status: 'ACTIVE'
                }
            });
            updatedCount++;
        }
    }

    console.log(`Updated ${updatedCount} FREE subscriptions with 1-year expiry.`);
    console.log('--- Activation Completed ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
