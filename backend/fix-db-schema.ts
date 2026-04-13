
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function fixSchema() {
    try {
        console.log('🛠️ Fixing Database Schema...');

        // Raw SQL to modify the column type to TEXT (allows 65,535 bytes)
        // Default prisma String is VARCHAR(191) which is too small for JSON.

        await prisma.$executeRawUnsafe(`
            ALTER TABLE transactions 
            MODIFY COLUMN metadata TEXT;
        `);

        console.log('✅ Success: transactions.metadata converted to TEXT.');

    } catch (error) {
        console.error('❌ Failed to update schema:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixSchema();
