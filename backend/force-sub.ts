
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL?.replace('localhost', '127.0.0.1')
        }
    }
});
const email = process.argv[2];

async function main() {
    if (!email) {
        console.error("Please provide an email address as an argument.");
        process.exit(1);
    }

    console.log(`🔍 Looking for user with email: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error("❌ User not found!");
        return;
    }

    console.log(`✅ User Found: ${user.name} (${user.id}) [${user.role}]`);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const sub = await prisma.subscription.upsert({
        where: { merchantId: user.id },
        update: {
            plan: 'PRO',
            status: 'ACTIVE',
            startDate,
            endDate
        },
        create: {
            merchantId: user.id,
            plan: 'PRO',
            status: 'ACTIVE',
            startDate,
            endDate
        }
    });

    console.log("✅ Subscription FORCED to PRO/ACTIVE successfully.");
    console.log(sub);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
