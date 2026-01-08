import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

import path from 'path';

// Try to load .env from multiple probable locations
const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    // Fallback to default check (PWD)
    dotenv.config();
}

console.log(`[Seed Debug] Loading env from: ${envPath}`);
console.log(`[Seed Debug] DATABASE_URL loaded: ${process.env.DATABASE_URL ? 'YES' : 'NO'}`);

if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL is missing. Please ensure backend/.env exists and contains DATABASE_URL.');
    process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.$connect();
        console.log('Database connected.');

        const email = 'mettoalex@gmail.com';
        const password = 'Digital2025';
        const hashedPassword = await bcrypt.hash(password, 10);
        const phoneNumber = '0700448448';

        console.log(`Seeding user: ${email}`);

        // Cast to any to bypass strict TS checks in seed script (schema vs generated client sync issues)
        const updateData: any = {
            passwordHash: hashedPassword,
            role: 'ADMIN',
            plan: 'PRO',
            features: JSON.stringify(["POS", "ANALYTICS", "TEAM_MANAGEMENT", "CRM", "ADVANCED_CRM"]),
            status: 'ACTIVE'
        };

        const createData: any = {
            email,
            name: 'Metto Alex',
            phoneNumber,
            passwordHash: hashedPassword,
            role: 'ADMIN',
            plan: 'PRO',
            features: JSON.stringify(["POS", "ANALYTICS", "TEAM_MANAGEMENT", "CRM", "ADVANCED_CRM"]),
            status: 'ACTIVE',
            // businessProfile: {
            //     create: {
            //         companyName: 'Anti Gravity HQ', 
            //         contactPhone: phoneNumber
            //     }
            // }
        };

        const user = await prisma.user.upsert({
            where: { email },
            update: updateData,
            create: createData
        });

        console.log('Seeded successfully:', user.id);

    } catch (error) {
        console.error('SEED FAILURE:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
