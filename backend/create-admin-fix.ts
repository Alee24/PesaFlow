
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        console.log('🌱 Creating/Updating admin accounts...');

        const password = 'Digital2025';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Account 1: admin@mpesaconnect.com
        await prisma.user.upsert({
            where: { email: 'admin@mpesaconnect.com' },
            update: {
                passwordHash: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                emailVerified: true
            },
            create: {
                email: 'admin@mpesaconnect.com',
                name: 'Super Admin',
                phoneNumber: '0712345678',
                passwordHash: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                emailVerified: true
            }
        });

        // Account 2: mettoalex@gmail.com
        await prisma.user.upsert({
            where: { email: 'mettoalex@gmail.com' },
            update: {
                passwordHash: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                emailVerified: true
            },
            create: {
                email: 'mettoalex@gmail.com',
                name: 'Metto Alex',
                phoneNumber: '0700448448',
                passwordHash: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                emailVerified: true
            }
        });

        console.log('✅ Admin accounts updated successfully!');
        console.log('🔑 Password for both:', password);
        console.log('📧 Accounts: admin@mpesaconnect.com, mettoalex@gmail.com');

    } catch (error) {
        console.error('❌ Error updating admins:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
