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
        const maskedUrl = process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@');
        console.log(`[Seed Debug] Database connected to: ${maskedUrl}`);

        const password = 'Digital2025';
        const hashedPassword = await bcrypt.hash(password, 10);

        // --- 1. Admin User ---
        console.log(`\n🌱 Seeding Admin: mettoalex@gmail.com`);
        const admin = await prisma.user.upsert({
            where: { email: 'mettoalex@gmail.com' },
            update: {
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
            },
            create: {
                email: 'mettoalex@gmail.com',
                name: 'Metto Alex',
                phoneNumber: '0700448448',
                passwordHash: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                subscription: {
                    create: {
                        plan: 'PRO',
                        features: JSON.stringify(["POS", "ANALYTICS", "TEAM_MANAGEMENT", "CRM", "ADVANCED_CRM"]),
                        status: 'ACTIVE'
                    }
                },
                wallet: { create: { balance: 0 } }
            }
        });
        console.log(`✅ Admin created/updated: ${admin.id}`);

        // --- 2. Active Merchant ---
        console.log(`\n🌱 Seeding Active Merchant: merchant@mpesaconnect.com`);
        const merchant = await prisma.user.upsert({
            where: { email: 'merchant@mpesaconnect.com' },
            update: {
                passwordHash: hashedPassword,
                status: 'ACTIVE',
                // Upsert subscription for merchant too
                subscription: {
                    upsert: {
                        create: { plan: 'BASIC', features: '[]', status: 'ACTIVE' },
                        update: { plan: 'BASIC', features: '[]', status: 'ACTIVE' }
                    }
                }
            },
            create: {
                name: 'Active Merchant',
                email: 'merchant@mpesaconnect.com',
                phoneNumber: '0723456789',
                passwordHash: hashedPassword,
                role: 'MERCHANT',
                status: 'ACTIVE',
                wallet: { create: { balance: 0 } },
                businessProfile: {
                    create: {
                        companyName: 'Test Business Ltd',
                        idNumber: '12345678',
                        kraPinNumber: 'A001234567P',
                        location: 'Nairobi, Kenya',
                        dataPolicyAccepted: true
                    }
                },
                subscription: {
                    create: { plan: 'BASIC', features: '[]', status: 'ACTIVE' }
                }
            }
        });
        console.log(`✅ Merchant created/updated: ${merchant.id}`);

        // --- 3. Pending Merchant ---
        console.log(`\n🌱 Seeding Pending Merchant: pending@mpesaconnect.com`);
        const pending = await prisma.user.upsert({
            where: { email: 'pending@mpesaconnect.com' },
            update: {
                passwordHash: hashedPassword,
                status: 'PENDING_VERIFICATION'
            },
            create: {
                name: 'Pending Merchant',
                email: 'pending@mpesaconnect.com',
                phoneNumber: '0734567890',
                passwordHash: hashedPassword,
                role: 'MERCHANT',
                status: 'PENDING_VERIFICATION',
                wallet: { create: { balance: 0 } },
                businessProfile: {
                    create: {
                        companyName: 'Pending Business',
                        idNumber: '87654321',
                        kraPinNumber: 'A007654321P',
                        location: 'Mombasa, Kenya',
                        dataPolicyAccepted: true
                    }
                },
                subscription: {
                    create: { plan: 'FREE', features: '[]', status: 'ACTIVE' }
                }
            }
        });
        console.log(`✅ Pending Merchant created/updated: ${pending.id}`);

        console.log('\n🎉 ALL SEEDING COMPLETE');
        console.log('---------------------------------------------------');
        console.log('Admin:    mettoalex@gmail.com       (Pass: Digital2025)');
        console.log('Merchant: merchant@mpesaconnect.com (Pass: Digital2025)');
        console.log('Pending:  pending@mpesaconnect.com  (Pass: Digital2025)');
        console.log('---------------------------------------------------');

    } catch (error) {
        console.error('SEED FAILURE:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
