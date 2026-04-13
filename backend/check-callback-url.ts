
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const profiles = await prisma.businessProfile.findMany({
        where: {
            mpesaConsumerKey: { not: null }
        },
        include: {
            user: { select: { email: true } }
        }
    });

    profiles.forEach(p => {
        console.log(`User: ${p.user.email}`);
        console.log(`Callback URL: '${p.mpesaCallbackUrl}'`); // Quotes to see if empty string or null
        console.log(`Env: ${p.mpesaEnv}`);
    });
}

check().finally(() => prisma.$disconnect());
