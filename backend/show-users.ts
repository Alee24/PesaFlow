import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showUsers() {
    try {
        const users = await prisma.user.findMany({
            include: {
                wallet: true,
                businessProfile: true
            }
        });

        console.log('\n📊 Current Users in Database:\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Phone: ${user.phoneNumber}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Status: ${user.status}`);
            console.log(`   Wallet Balance: KES ${user.wallet?.balance || 0}`);
            console.log(`   Business Profile: ${user.businessProfile ? 'Yes' : 'No'}`);
            console.log('');
        });

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Total Users: ${users.length}\n`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

showUsers();
