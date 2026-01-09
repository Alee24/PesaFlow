import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function clearAndReseed() {
    try {
        console.log('🗑️  Starting database cleanup...\n');

        // Delete all data in reverse order of dependencies
        console.log('Deleting transactions...');
        await prisma.transaction.deleteMany({});

        console.log('Deleting sale items...');
        await prisma.saleItem.deleteMany({});

        console.log('Deleting sales...');
        await prisma.sale.deleteMany({});

        console.log('Deleting stock movements...');
        await prisma.stockMovement.deleteMany({});

        console.log('Deleting products...');
        await prisma.product.deleteMany({});

        console.log('Deleting categories...');
        await prisma.category.deleteMany({});

        console.log('Deleting withdrawals...');
        await prisma.withdrawal.deleteMany({});

        console.log('Deleting wallets...');
        await prisma.wallet.deleteMany({});

        console.log('Deleting subscriptions...');
        await prisma.subscription.deleteMany({});

        console.log('Deleting business profiles...');
        await prisma.businessProfile.deleteMany({});

        console.log('Deleting notifications...');
        await prisma.notification.deleteMany({});

        console.log('Deleting support tickets...');
        await prisma.supportTicket.deleteMany({});

        console.log('Deleting users...');
        await prisma.user.deleteMany({});

        console.log('\n✅ Database cleared successfully!\n');

        // Create default users
        console.log('🌱 Seeding default users...\n');

        const hashedPassword = await bcrypt.hash('Digital2025', 10);

        // 1. Admin User
        const admin = await prisma.user.create({
            data: {
                email: 'admin@mpesaconnect.co.ke',
                password: hashedPassword,
                name: 'System Admin',
                role: 'ADMIN',
                status: 'ACTIVE',
                phoneNumber: '+254700000000'
            }
        });
        console.log('✅ Created Admin:', admin.email);

        // Create admin wallet
        await prisma.wallet.create({
            data: {
                userId: admin.id,
                balance: 0
            }
        });

        // 2. Test Merchant
        const merchant = await prisma.user.create({
            data: {
                email: 'mettoalex@gmail.com',
                password: hashedPassword,
                name: 'Test Merchant',
                role: 'MERCHANT',
                status: 'ACTIVE',
                phoneNumber: '+254712345678',
                businessProfile: {
                    create: {
                        businessName: 'Test Business',
                        businessType: 'RETAIL',
                        kraPin: 'A000000000A',
                        location: 'Nairobi, Kenya'
                    }
                }
            }
        });
        console.log('✅ Created Merchant:', merchant.email);

        // Create merchant wallet
        await prisma.wallet.create({
            data: {
                userId: merchant.id,
                balance: 0
            }
        });

        // Create PRO subscription for merchant
        await prisma.subscription.create({
            data: {
                merchantId: merchant.id,
                plan: 'PRO',
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                features: {
                    POS: true,
                    ANALYTICS: true,
                    INVOICING: true,
                    MULTI_USER: true,
                    API_ACCESS: true
                }
            }
        });
        console.log('✅ Created PRO subscription for merchant');

        // 3. Demo Branch Manager
        const branchManager = await prisma.user.create({
            data: {
                email: 'branch@mpesaconnect.co.ke',
                password: hashedPassword,
                name: 'Branch Manager',
                role: 'BRANCH_MANAGER',
                status: 'ACTIVE',
                phoneNumber: '+254723456789',
                parentId: merchant.id
            }
        });
        console.log('✅ Created Branch Manager:', branchManager.email);

        // Create branch manager wallet
        await prisma.wallet.create({
            data: {
                userId: branchManager.id,
                balance: 0
            }
        });

        // 4. Create sample categories
        const categories = await Promise.all([
            prisma.category.create({
                data: {
                    name: 'Electronics',
                    merchantId: merchant.id
                }
            }),
            prisma.category.create({
                data: {
                    name: 'Clothing',
                    merchantId: merchant.id
                }
            }),
            prisma.category.create({
                data: {
                    name: 'Food & Beverages',
                    merchantId: merchant.id
                }
            })
        ]);
        console.log('✅ Created sample categories');

        // 5. Create sample products
        await Promise.all([
            prisma.product.create({
                data: {
                    name: 'Sample Product 1',
                    price: 1000,
                    costPrice: 800,
                    stockQuantity: 50,
                    merchantId: merchant.id,
                    categoryId: categories[0].id,
                    sku: 'PROD001',
                    barcode: '1234567890123',
                    status: 'ACTIVE'
                }
            }),
            prisma.product.create({
                data: {
                    name: 'Sample Product 2',
                    price: 2500,
                    costPrice: 2000,
                    stockQuantity: 30,
                    merchantId: merchant.id,
                    categoryId: categories[1].id,
                    sku: 'PROD002',
                    barcode: '1234567890124',
                    status: 'ACTIVE'
                }
            }),
            prisma.product.create({
                data: {
                    name: 'Sample Product 3',
                    price: 500,
                    costPrice: 300,
                    stockQuantity: 100,
                    merchantId: merchant.id,
                    categoryId: categories[2].id,
                    sku: 'PROD003',
                    barcode: '1234567890125',
                    status: 'ACTIVE'
                }
            })
        ]);
        console.log('✅ Created sample products');

        console.log('\n🎉 Database reseeded successfully!\n');
        console.log('📋 Default Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Admin:');
        console.log('  Email: admin@mpesaconnect.co.ke');
        console.log('  Password: Digital2025');
        console.log('');
        console.log('Merchant:');
        console.log('  Email: mettoalex@gmail.com');
        console.log('  Password: Digital2025');
        console.log('');
        console.log('Branch Manager:');
        console.log('  Email: branch@mpesaconnect.co.ke');
        console.log('  Password: Digital2025');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Error during cleanup and reseed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
clearAndReseed()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
