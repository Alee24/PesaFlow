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

    // Debug DB Connection
    const dbUrl = process.env.DATABASE_URL || 'UNDEFINED';
    console.log(`🔌 Connected to DB: ${dbUrl.replace(/:.*@/, ':****@')}`);

    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();

    console.log(`📊 DB Stats: Users=${userCount}, Products=${productCount}`);

    console.log('------------------------------------------------------------------------------------------------');
    console.log(pad('Product Name', 25) + ' | ' + 'Image URL (Raw from DB)');
    console.log('------------------------------------------------------------------------------------------------');

    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(process.cwd(), 'public');

    products.forEach(p => {
        const url = p.imageUrl || 'NULL';
        let status = '✅ OK (Relative)';
        let fileExists = '❓ N/A';

        if (url === 'NULL') {
            status = '⚪ Empty';
        } else if (url.includes('localhost') || url.includes('127.0.0.1')) {
            status = '❌ BAD (Localhost)';
        } else if (url.startsWith('http')) {
            status = '⚠️ External/Absolute';
        } else {
            // Check file existence for relative paths
            const filePath = path.join(uploadDir, url);
            if (fs.existsSync(filePath)) {
                fileExists = '✅ Found';
            } else {
                fileExists = '❌ Missing on Disk';
                status = '❌ BAD (File Missing)';
            }
        }

        console.log(pad(p.name, 20) + ' | ' + pad(url, 40) + ' | ' + status + ' | ' + fileExists);
    });
    console.log('------------------------------------------------------------------------------------------------');
}

function pad(str: string, len: number) {
    return (str || '').padEnd(len).substring(0, len);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
