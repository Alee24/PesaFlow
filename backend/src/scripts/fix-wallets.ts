
import { PrismaClient } from '@prisma/client';
import path from 'path';
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function fixWallets() {
    console.log("🔧 Fixing Missing Wallets...");

    // Find users
    const users = await prisma.user.findMany({
        include: { wallet: true }
    });

    for (const user of users) {
        if (!user.wallet) {
            console.log(`   🔸 User '${user.email}' has NO wallet. Creating...`);
            await prisma.wallet.create({
                data: {
                    userId: user.id,
                    balance: 0
                }
            });
            console.log("      ✅ Wallet created.");
        } else {
            console.log(`   🔹 User '${user.email}' has wallet.`);
        }
    }

    await prisma.$disconnect();
}

fixWallets();
