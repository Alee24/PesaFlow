
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function diagnose() {
    try {
        console.log('🔍 Starting Invoice System Diagnosis...\n');

        // 1. Check Use Connection
        console.log('📡 Checking Database Connection...');
        await prisma.$connect();
        console.log('✅ Connected.\n');

        // 2. List All Users
        console.log('👤 Checking User Accounts & Wallets:');
        const users = await prisma.user.findMany({
            include: {
                wallet: true,
                businessProfile: true
            }
        });

        if (users.length === 0) {
            console.log('❌ No users found in database! Did you run the seed script?');
        }

        for (const user of users) {
            console.log(`\n   User: ${user.email} (${user.role})`);
            console.log(`   ID: ${user.id}`);

            // Check Wallet
            if (user.wallet) {
                console.log(`   ✅ Wallet Found (Balance: ${user.wallet.balance})`);
            } else {
                console.log(`   ❌ WALLET MISSING! Invoice creation will FAIL.`);
                console.log(`      Action: Run seed script or manually create wallet.`);
            }

            // Check Profile
            if (user.businessProfile) {
                console.log(`   ✅ Business Profile Found`);
            } else {
                console.log(`   ⚠️ Business Profile Missing (Invoice might default values)`);
            }
        }

        console.log('\n📦 Checking Product "General Invoice Item"...');
        const count = await prisma.product.count({ where: { name: 'General Invoice Item' } });
        console.log(`   Found ${count} generic items (created automatically per merchant).`);

    } catch (error) {
        console.error('❌ Diagnosis Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
