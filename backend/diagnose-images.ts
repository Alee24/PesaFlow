import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

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

    const uploadDir = path.join(process.cwd(), 'public/uploads');
    console.log(`📂 Backend CWD: ${process.cwd()}`);
    console.log(`📂 Checking Uploads in: ${uploadDir} (Exists: ${fs.existsSync(uploadDir)})`);
    console.log('------------------------------------------------------------------------------------------------');

    products.forEach(p => {
        const url = p.imageUrl || 'NULL';
        let status = '✅ OK (Relative)';

        if (url === 'NULL') {
            status = '⚪ Empty';
        } else if (url.includes('localhost') || url.includes('127.0.0.1')) {
            status = '❌ BAD (Localhost)';
        } else if (url.startsWith('http')) {
            status = '⚠️ External/Absolute';
        } else {
            // Check file existence
            const filePath = path.join(process.cwd(), 'public', url);
            if (fs.existsSync(filePath)) {
                const stat = fs.statSync(filePath);
                const mode = (stat.mode & 0o777).toString(8);
                status = `✅ Found (Perms: ${mode})`;
            } else {
                status = `❌ MISSING at ${filePath}`;
            }
        }

        console.log(pad(p.name, 25) + ' | ' + pad(url, 40) + ' | ' + status);
    });
    console.log('------------------------------------------------------------------------------------------------');
}

function pad(str: string, len: number) {
    return (str || '').padEnd(len).substring(0, len);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
