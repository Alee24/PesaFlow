import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdmin() {
    try {
        console.log('🌱 Seeding admin account...');

        const email = 'mettoalex@gmail.com';

        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email }
        });

        if (existingAdmin) {
            console.log('ℹ️  Admin account already exists');
            console.log('📧 Email:', existingAdmin.email);
            console.log('👤 Role:', existingAdmin.role);

            // Update password if needed
            const hashedPassword = await bcrypt.hash('Digital2025', 10);
            await prisma.user.update({
                where: { email },
                data: {
                    passwordHash: hashedPassword,
                    role: 'ADMIN',
                    status: 'ACTIVE',
                    emailVerified: true
                }
            });
            console.log('✅ Admin password updated to: Digital2025');
        } else {
            // Create new admin user
            const hashedPassword = await bcrypt.hash('Digital2025', 10);
            const admin = await prisma.user.create({
                data: {
                    email,
                    name: 'Admin',
                    phoneNumber: '+254724454757',
                    passwordHash: hashedPassword,
                    role: 'ADMIN',
                    status: 'ACTIVE',
                    emailVerified: true
                }
            });

            console.log('✅ Admin account created successfully!');
            console.log('📧 Email:', admin.email);
            console.log('🔑 Password: Digital2025');
            console.log('👤 Role:', admin.role);
        }

    } catch (error) {
        console.error('❌ Error seeding admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedAdmin();
