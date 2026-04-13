
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reset() {
    const email = 'mettoalex@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log('User not found');
        return;
    }

    await prisma.businessProfile.update({
        where: { userId: user.id },
        data: {
            mpesaConsumerKey: null,
            mpesaConsumerSecret: null,
            mpesaShortcode: null,
            mpesaPasskey: null,
            mpesaInitiatorName: null,
            mpesaInitiatorPass: null,
            mpesaEnv: null // Will fallback to env var
        }
    });

    console.log(`Cleared M-Pesa settings for ${email}`);
}

reset()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
