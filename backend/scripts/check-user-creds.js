
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking User M-Pesa Settings ---');

    // We'll look for the main user (Metto)
    const user = await prisma.user.findFirst({
        where: { email: 'mettoalex@gmail.com' },
        include: { businessProfile: true }
    });

    if (!user) {
        console.log('User not found!');
        return;
    }

    console.log(`User: ${user.email} (${user.id})`);

    const profile = user.businessProfile;
    if (profile) {
        console.log('Business Profile Found:');
        console.log(`- Consumer Key: ${profile.mpesaConsumerKey ? 'SET (Might be overriding Env)' : 'NOT SET (Using Env)'}`);
        console.log(`- Consumer Secret: ${profile.mpesaConsumerSecret ? 'SET' : 'NOT SET'}`);
        console.log(`- Passkey: ${profile.mpesaPasskey ? 'SET' : 'NOT SET'}`);
        console.log(`- Shortcode: ${profile.mpesaShortcode || 'NOT SET'}`);

        if (profile.mpesaConsumerKey) {
            console.log('\n⚠️  WARNING: Database credentials are set. The app is using THESE instead of your .env file.');
            console.log(`   Key in DB: ${profile.mpesaConsumerKey.substring(0, 5)}...`);
        }
    } else {
        console.log('No Business Profile found. App should be using .env');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
