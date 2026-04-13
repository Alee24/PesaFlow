
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const profiles = await prisma.businessProfile.findMany({
        where: {
            mpesaConsumerKey: { not: null }
        },
        include: {
            user: {
                select: { email: true, name: true }
            }
        }
    });

    console.log('Found profiles with M-Pesa Settings:', profiles.length);
    profiles.forEach(p => {
        console.log('------------------------------------------------');
        console.log(`User: ${p.user.name} (${p.user.email})`);
        console.log(`Key: ${p.mpesaConsumerKey}`);
        console.log(`Secret: ${p.mpesaConsumerSecret}`);
        console.log(`Shortcode: ${p.mpesaShortcode}`);
        console.log('------------------------------------------------');
    });
}

check()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
