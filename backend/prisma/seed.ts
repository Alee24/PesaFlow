import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

import path from 'path';
import fs from 'fs';

// Robust environment loading
const possiblePaths = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../env'),        // Common mistake: missing dot
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'env')
];

let envLoaded = false;
let loadedPath = '';

console.log('[Seed Debug] Searching for environment file...');

for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        console.log(`[Seed Debug] Found file at: ${p}`);
        const result = dotenv.config({ path: p });
        if (!result.error && process.env.DATABASE_URL) {
            envLoaded = true;
            loadedPath = p;
            console.log(`[Seed Debug] ✅ Successfully loaded DATABASE_URL from ${p}`);
            break;
        }
    }
}

// Fallback to default loading if nothing found yet (in case it's in system env)
if (!envLoaded) {
    console.log('[Seed Debug] No file found/loaded. Checking system environment...');
    dotenv.config();
}

// Debug output for DATABASE_URL (masked)
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
    const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
    console.log(`[Seed Debug] Current DATABASE_URL: ${maskedUrl}`);

    // Warning for common malformation: mysql:////
    if (dbUrl.startsWith('mysql:////')) {
        console.warn('⚠️  WARNING: Your DATABASE_URL starts with "mysql:////". This commonly causes connection errors.');
        console.warn('👉 It should likely be "mysql://user:pass..." (only two slashes).');
    }
} else {
    console.error('❌ Error: DATABASE_URL is missing.');
    console.error('Please ensure you have a .env file in the backend directory with DATABASE_URL set.');
    console.error('Searched locations:', possiblePaths.map(p => path.basename(p)).join(', '));
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
            status: 'ACTIVE',
            subscription: {
                upsert: {
                    create: {
                        plan: 'PRO',
                        features: JSON.stringify(["POS", "ANALYTICS", "TEAM_MANAGEMENT", "CRM", "ADVANCED_CRM"]),
                        status: 'ACTIVE'
                    },
                    update: {
                        plan: 'PRO',
                        features: JSON.stringify(["POS", "ANALYTICS", "TEAM_MANAGEMENT", "CRM", "ADVANCED_CRM"]),
                        status: 'ACTIVE'
                    }
                }
            }
        };

        const createData: any = {
            email,
            name: 'Metto Alex',
            phoneNumber,
            passwordHash: hashedPassword,
            role: 'ADMIN',
            status: 'ACTIVE',
            subscription: {
                create: {
                    plan: 'PRO',
                    features: JSON.stringify(["POS", "ANALYTICS", "TEAM_MANAGEMENT", "CRM", "ADVANCED_CRM"]),
                    status: 'ACTIVE'
                }
            }
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
