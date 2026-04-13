
import { PrismaClient } from '@prisma/client';

async function diagnose() {
    const prisma = new PrismaClient();
    console.log('--- Database Diagnosis Start ---');
    try {
        console.log('Testing connection...');
        await prisma.$connect();
        console.log('✅ Connection successful!');

        console.log('Testing "User" table...');
        const userCount = await prisma.user.count();
        console.log(`✅ "User" table exists. Count: ${userCount}`);

        const tables = await prisma.$queryRaw`SHOW TABLES`;
        console.log('Tables in database:', JSON.stringify(tables, null, 2));

    } catch (error) {
        console.error('❌ Diagnosis failed!');
        console.error('Error details:', error);
        if (error.code) console.error('Error Code:', error.code);
        if (error.meta) console.error('Error Meta:', JSON.stringify(error.meta));
    } finally {
        await prisma.$disconnect();
        console.log('--- Database Diagnosis End ---');
    }
}

diagnose();
