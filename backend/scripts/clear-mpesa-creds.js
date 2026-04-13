
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('--- Clearing M-Pesa Database Credentials ---');

    const user = await prisma.user.findFirst({
        where: { email: 'mettoalex@gmail.com' }
    });

    if (!user) {
        console.log('User not found.');
        return;
    }

    // Update profile to remove M-Pesa keys so it falls back to Env
    await prisma.businessProfile.update({
        where: { userId: user.id },
        data: {
            mpesaConsumerKey: null,
            mpesaConsumerSecret: null,
            mpesaPasskey: null,
            mpesaShortcode: null
        }
    });

    console.log('✅ Successfully cleared DB credentials.');
    console.log('The app will now use the settings from your .env file.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
