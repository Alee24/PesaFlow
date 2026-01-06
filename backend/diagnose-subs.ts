
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Diagnosing Subscriptions...\n');

    const users = await prisma.user.findMany({
        include: {
            subscription: true
        }
    });

    console.log(`Found ${users.length} users.`);
    console.log('------------------------------------------------');
    console.log(String('Name').padEnd(20), String('Email').padEnd(30), String('ID').padEnd(10), String('Sub Plan').padEnd(10), String('End Date'));
    console.log('------------------------------------------------');

    users.forEach(u => {
        const sub = u.subscription;
        const plan = sub ? sub.plan : 'NONE';
        const endDate = sub ? sub.endDate.toISOString().split('T')[0] : '-';
        console.log(
            u.name?.slice(0, 19).padEnd(20),
            u.email.slice(0, 29).padEnd(30),
            u.id.slice(0, 8).padEnd(10),
            plan.padEnd(10),
            endDate
        );
    });
    console.log('------------------------------------------------');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
