import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';


if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not defined in environment variables!');
    process.exit(1);
}

console.log(`🔧 Using Database URL: ${process.env.DATABASE_URL.split('@')[1] || '...hidden...'}`); // Log host only for safety

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function createTestUsers() {
    try {
        console.log('🔧 Creating test users...\n');

        // Hash password
        const hashedPassword = await bcrypt.hash('Digital2025', 10);

        // Upsert Admin User
        const admin = await prisma.user.upsert({
            where: { email: 'mettoalex@gmail.com' },
            update: {
                passwordHash: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE'
            },
            create: {
                name: 'Super Admin',
                email: 'mettoalex@gmail.com',
                phoneNumber: '0712345678',
                passwordHash: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                wallet: {
                    create: {
                        balance: 100000
                    }
                },
                // Add business profile for completeness if needed, but Admin usually doesn't need one strict
            }
        });

        console.log('✅ Admin user configured:');
        console.log('   Email: mettoalex@gmail.com');
        console.log('   Password: Digital2025');
        console.log('   Role: ADMIN');
        console.log('   Status: ACTIVE\n');

        // Create Merchant User (Active)
        const merchantActive = await prisma.user.create({
            data: {
                name: 'Active Merchant',
                email: 'merchant@mpesaconnect.com',
                phoneNumber: '0723456789',
                passwordHash: hashedPassword,
                role: 'MERCHANT',
                status: 'ACTIVE',
                wallet: {
                    create: {
                        balance: 5000
                    }
                },
                businessProfile: {
                    create: {
                        companyName: 'Test Business Ltd',
                        idNumber: '12345678',
                        kraPinNumber: 'A001234567P',
                        location: 'Nairobi, Kenya',
                        dataPolicyAccepted: true
                    }
                }
            }
        });

        console.log('✅ Active Merchant created:');
        console.log('   Email: merchant@mpesaconnect.com');
        console.log('   Password: admin123');
        console.log('   Role: MERCHANT');
        console.log('   Status: ACTIVE\n');

        // Create Pending Merchant
        const merchantPending = await prisma.user.create({
            data: {
                name: 'Pending Merchant',
                email: 'pending@mpesaconnect.com',
                phoneNumber: '0734567890',
                passwordHash: hashedPassword,
                role: 'MERCHANT',
                status: 'PENDING_VERIFICATION',
                wallet: {
                    create: {
                        balance: 0
                    }
                },
                businessProfile: {
                    create: {
                        companyName: 'Pending Business',
                        idNumber: '87654321',
                        kraPinNumber: 'A007654321P',
                        location: 'Mombasa, Kenya',
                        dataPolicyAccepted: true
                    }
                }
            }
        });

        console.log('✅ Pending Merchant created:');
        console.log('   Email: pending@mpesaconnect.com');
        console.log('   Password: admin123');
        console.log('   Role: MERCHANT');
        console.log('   Status: PENDING_VERIFICATION\n');

        console.log('🎉 All test users created successfully!\n');
        console.log('📝 Login Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Admin Account:');
        console.log('  Email: admin@mpesaconnect.com');
        console.log('  Password: admin123');
        console.log('');
        console.log('Active Merchant Account:');
        console.log('  Email: merchant@mpesaconnect.com');
        console.log('  Password: admin123');
        console.log('');
        console.log('Pending Merchant Account (for testing restrictions):');
        console.log('  Email: pending@mpesaconnect.com');
        console.log('  Password: admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Error creating test users:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createTestUsers()
    .then(() => {
        console.log('✅ Setup completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Setup failed!');
        console.error(error);
        process.exit(1);
    });
