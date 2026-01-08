
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugData() {
    try {
        console.log('--- Sales Data ---');
        const sales = await prisma.sale.findMany({
            take: 10,
            include: { items: true }
        });
        console.log(JSON.stringify(sales, null, 2));

        console.log('--- Total Sales Count ---');
        const count = await prisma.sale.count();
        console.log(count);

        console.log('--- Customers ---');
        const customers = await prisma.customer.findMany({ take: 10 });
        console.log(JSON.stringify(customers, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debugData();
