import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'mettoalex@gmail.com';
    const password = 'Digital2025';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('🔄 Resetting admin account...');

    // Delete existing admin user if exists
    await prisma.user.deleteMany({
        where: { email }
    });

    // Create fresh admin user
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash: hashedPassword,
            name: 'Metto Alex',
            phoneNumber: '254700000000',
            role: 'ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
            licenseActivated: true,
            licenseType: 'ACTIVATED',
            licenseActivatedAt: new Date()
        },
    });

    // Create/Update subscription
    await prisma.subscription.upsert({
        where: { merchantId: user.id },
        create: {
            merchantId: user.id,
            plan: 'ENTERPRISE',
            status: 'ACTIVE',
            features: JSON.stringify(['all']),
            isEnterprise: true,
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        },
        update: {
            plan: 'ENTERPRISE',
            status: 'ACTIVE',
            features: JSON.stringify(['all']),
            isEnterprise: true,
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
    });

    console.log('✅ Admin account reset successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Role: ADMIN');
    console.log('📦 Plan: ENTERPRISE');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
