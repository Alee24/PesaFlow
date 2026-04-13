
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Sales Data ---');

    // 1. Check Users
    const users = await prisma.user.findMany({
        include: { businessProfile: true }
    });
    console.log(`Found ${users.length} users.`);
    users.forEach(u => {
        console.log(`User: ${u.email}, ID: ${u.id}, Role: ${u.role}, MerchantID: ${u.merchantId || 'N/A'}`);
    });

    // 2. Check Sales
    const sales = await prisma.sale.findMany({
        take: 50
    });
    console.log(`\nFound ${sales.length} total sales.`);
    if (sales.length > 0) {
        console.log('Sample Sales:', sales.map(s => ({
            id: s.id,
            merchantId: s.merchantId,
            amount: s.totalAmount,
            date: s.createdAt
        })));
    } else {
        console.log('No Sales Found in DB!');
    }

    // 3. Count Sales per Merchant
    const salesCount = await prisma.sale.groupBy({
        by: ['merchantId'],
        _count: { id: true }
    });
    console.log('\nSales count by MerchantID:', salesCount);

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
