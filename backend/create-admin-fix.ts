
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        console.log('🌱 Creating admin account: admin@mpesaconnect.com');

        const email = 'admin@mpesaconnect.com';
        const hashedPassword = await bcrypt.hash('Digital2025', 10);

        const admin = await prisma.user.upsert({
            where: { email },
            update: {
                passwordHash: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                emailVerified: true
            },
            create: {
                email,
                name: 'Super Admin',
                phoneNumber: '0712345678',
                passwordHash: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                emailVerified: true,
                wallet: {
                    create: {
                        balance: 0
                    }
                }
            }
        });

        console.log('✅ Admin account created successfully!');
        console.log('📧 Email:', admin.email);
        console.log('🔑 Password: Digital2025');
        console.log('👤 Role:', admin.role);

    } catch (error) {
        console.error('❌ Error creating admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
