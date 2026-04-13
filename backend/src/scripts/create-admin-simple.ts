
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Force load env from backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function createSuperAdmin() {
    const email = 'mettoalex@gmail.com';
    const password = 'Digital2025';

    console.log(`Creating/Updating Super Admin (${email})...`);

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if exists
        const existing = await prisma.user.findUnique({ where: { email } });

        if (existing) {
            console.log("   User exists. Updating role/password...");
            await prisma.user.update({
                where: { email },
                data: {
                    passwordHash: hashedPassword,
                    role: 'ADMIN',
                    status: 'ACTIVE'
                }
            });
        } else {
            console.log("   Creating new user...");
            await prisma.user.create({
                data: {
                    email,
                    passwordHash: hashedPassword,
                    role: 'ADMIN',
                    name: 'Super Admin',
                    phoneNumber: '0700000000',
                    status: 'ACTIVE',
                    wallet: { create: { balance: 0 } },
                    businessProfile: { create: { companyName: 'Metto Admin' } }
                }
            });
        }
        console.log("SUCCESS: Super Admin is ready.");
    } catch (e: any) {
        console.error("ERROR:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

createSuperAdmin();
