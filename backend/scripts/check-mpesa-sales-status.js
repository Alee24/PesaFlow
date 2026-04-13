const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('--- M-Pesa Sales Status Check ---\n');

    // Get recent M-Pesa sales
    const sales = await prisma.sale.findMany({
        where: {
            paymentMethod: 'MPESA_STK',
            createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today
            }
        },
        include: {
            transaction: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    console.log(`Found ${sales.length} M-Pesa sales today:\n`);

    sales.forEach((sale, i) => {
        console.log(`${i + 1}. Sale ID: ${sale.id}`);
        console.log(`   Amount: KES ${sale.totalAmount}`);
        console.log(`   Payment Status: ${sale.paymentStatus}`);
        console.log(`   Created: ${sale.createdAt}`);

        if (sale.transaction) {
            console.log(`   Transaction Status: ${sale.transaction.status}`);
            console.log(`   Transaction ID: ${sale.transaction.id}`);
            console.log(`   Merchant Request ID: ${sale.transaction.merchantRequestId || 'N/A'}`);
        } else {
            console.log(`   ⚠️  No linked transaction found!`);
        }
        console.log('');
    });

    // Check callback URL configuration
    console.log('\n--- Callback URL Configuration ---');
    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        include: { businessProfile: true }
    });

    if (admin?.businessProfile?.mpesaCallbackUrl) {
        console.log(`Callback URL (DB): ${admin.businessProfile.mpesaCallbackUrl}`);
    } else {
        console.log(`Callback URL (ENV): ${process.env.MPESA_CALLBACK_URL || 'NOT SET'}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
