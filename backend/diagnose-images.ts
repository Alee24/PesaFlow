import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Diagnosing Product Images...\n');

    const products = await prisma.product.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            imageUrl: true
        }
    });

    console.log(`Found ${products.length} recent products.`);
    console.log('------------------------------------------------------------------------------------------------');
    console.log(pad('Product Name', 25) + ' | ' + 'Image URL (Raw from DB)');
    console.log('------------------------------------------------------------------------------------------------');

    products.forEach(p => {
        const url = p.imageUrl || 'NULL';
        let status = '✅ OK (Relative)';

        if (url === 'NULL') status = '⚪ Empty';
        else if (url.includes('localhost') || url.includes('127.0.0.1')) status = '❌ BAD (Localhost)';
        else if (url.startsWith('http')) status = '⚠️ External/Absolute';

        console.log(pad(p.name, 25) + ' | ' + pad(url, 50) + ' | ' + status);
    });
    console.log('------------------------------------------------------------------------------------------------');
}

function pad(str: string, len: number) {
    return (str || '').padEnd(len).substring(0, len);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
