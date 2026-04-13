
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearCallback() {
    const email = 'mettoalex@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
        await prisma.businessProfile.update({
            where: { userId: user.id },
            data: { mpesaCallbackUrl: null } // Clear it to use env var
        });
        console.log('Cleared invalid Callback URL for user.');
    } else {
        console.log('User not found.');
    }
}

clearCallback().finally(() => prisma.$disconnect());
