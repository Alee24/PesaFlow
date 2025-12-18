import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabaseConnection() {
    try {
        console.log('🔍 Testing database connection...\n');

        // Test 1: Basic connection
        await prisma.$connect();
        console.log('✅ Database connection successful!\n');

        // Test 2: Check Product table with new fields
        console.log('📦 Testing Product table with new inventory fields...');
        const productCount = await prisma.product.count();
        console.log(`   Found ${productCount} products`);

        if (productCount > 0) {
            const sampleProduct = await prisma.product.findFirst({
                select: {
                    id: true,
                    name: true,
                    barcode: true,
                    costPrice: true,
                    stockQuantity: true,
                    minStockLevel: true,
                    reorderPoint: true,
                    supplierName: true,
                    unit: true,
                    taxRate: true
                }
            });
            console.log('   Sample product fields:', sampleProduct);
        }
        console.log('✅ Product table working with new fields!\n');

        // Test 3: Check StockMovement table
        console.log('📊 Testing StockMovement table...');
        const movementCount = await prisma.stockMovement.count();
        console.log(`   Found ${movementCount} stock movements`);
        console.log('✅ StockMovement table working!\n');

        // Test 4: Check Sale table with new fields
        console.log('💰 Testing Sale table with new POS fields...');
        const saleCount = await prisma.sale.count();
        console.log(`   Found ${saleCount} sales`);

        if (saleCount > 0) {
            const sampleSale = await prisma.sale.findFirst({
                select: {
                    id: true,
                    customerName: true,
                    subtotal: true,
                    discountType: true,
                    discountAmount: true,
                    taxAmount: true,
                    totalAmount: true,
                    paymentMethod: true,
                    paymentStatus: true,
                    changeGiven: true
                }
            });
            console.log('   Sample sale fields:', sampleSale);
        }
        console.log('✅ Sale table working with new fields!\n');

        // Test 5: Check User table with verification fields
        console.log('👤 Testing User table with verification fields...');
        const userCount = await prisma.user.count();
        console.log(`   Found ${userCount} users`);

        const pendingUsers = await prisma.user.count({
            where: { status: 'PENDING_VERIFICATION' }
        });
        console.log(`   Pending verification: ${pendingUsers}`);

        const activeUsers = await prisma.user.count({
            where: { status: 'ACTIVE' }
        });
        console.log(`   Active users: ${activeUsers}`);
        console.log('✅ User verification system working!\n');

        // Test 6: Check BusinessProfile with KYC fields
        console.log('🏢 Testing BusinessProfile with KYC fields...');
        const profileCount = await prisma.businessProfile.count();
        console.log(`   Found ${profileCount} business profiles`);

        if (profileCount > 0) {
            const sampleProfile = await prisma.businessProfile.findFirst({
                select: {
                    companyName: true,
                    idNumber: true,
                    kraPinNumber: true,
                    idFrontUrl: true,
                    businessPermitUrl: true,
                    dataPolicyAccepted: true
                }
            });
            console.log('   Sample profile fields:', sampleProfile);
        }
        console.log('✅ BusinessProfile with KYC working!\n');

        console.log('🎉 All database tests passed successfully!');
        console.log('📊 Summary:');
        console.log(`   - Products: ${productCount}`);
        console.log(`   - Stock Movements: ${movementCount}`);
        console.log(`   - Sales: ${saleCount}`);
        console.log(`   - Users: ${userCount} (${activeUsers} active, ${pendingUsers} pending)`);
        console.log(`   - Business Profiles: ${profileCount}`);

    } catch (error) {
        console.error('❌ Database test failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

testDatabaseConnection()
    .then(() => {
        console.log('\n✅ Database connection test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Database connection test failed!');
        console.error(error);
        process.exit(1);
    });
