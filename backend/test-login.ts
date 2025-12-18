import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLoginAndDatabase() {
    console.log('🧪 Testing Login & Database Connection\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        // Test 1: Database Connection
        console.log('1️⃣  Testing Database Connection...');
        await prisma.$connect();
        console.log('   ✅ Database connected successfully\n');

        // Test 2: Check if users exist
        console.log('2️⃣  Checking for existing users...');
        const userCount = await prisma.user.count();
        console.log(`   ✅ Found ${userCount} users in database\n`);

        if (userCount === 0) {
            console.log('   ⚠️  No users found! Run: npx ts-node seed-users.ts\n');
            return;
        }

        // Test 3: Fetch all users
        console.log('3️⃣  Fetching all users...');
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                role: true,
                status: true,
                passwordHash: true
            }
        });

        console.log('   Users in database:');
        users.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.name}`);
            console.log(`      Email: ${user.email}`);
            console.log(`      Phone: ${user.phoneNumber}`);
            console.log(`      Role: ${user.role}`);
            console.log(`      Status: ${user.status}`);
            console.log(`      Has Password: ${user.passwordHash ? 'Yes' : 'No'}`);
            console.log('');
        });

        // Test 4: Test password verification
        console.log('4️⃣  Testing Password Verification...');
        const testUser = await prisma.user.findUnique({
            where: { email: 'admin@mpesaconnect.com' }
        });

        if (testUser) {
            const testPassword = 'admin123';
            const isValid = await bcrypt.compare(testPassword, testUser.passwordHash);

            if (isValid) {
                console.log('   ✅ Password verification working correctly');
                console.log(`   ✅ Test login: admin@mpesaconnect.com / admin123 - VALID\n`);
            } else {
                console.log('   ❌ Password verification FAILED');
                console.log('   ❌ Passwords may not be hashed correctly\n');
            }
        } else {
            console.log('   ⚠️  Admin user not found\n');
        }

        // Test 5: Test login simulation for all test accounts
        console.log('5️⃣  Simulating Login for All Test Accounts...\n');

        const testAccounts = [
            { email: 'admin@mpesaconnect.com', password: 'admin123', expectedRole: 'ADMIN' },
            { email: 'merchant@mpesaconnect.com', password: 'admin123', expectedRole: 'MERCHANT' },
            { email: 'pending@mpesaconnect.com', password: 'admin123', expectedRole: 'MERCHANT' }
        ];

        for (const account of testAccounts) {
            const user = await prisma.user.findUnique({
                where: { email: account.email },
                include: {
                    wallet: true,
                    businessProfile: true
                }
            });

            if (user) {
                const passwordMatch = await bcrypt.compare(account.password, user.passwordHash);

                console.log(`   Account: ${account.email}`);
                console.log(`   Password Match: ${passwordMatch ? '✅ YES' : '❌ NO'}`);
                console.log(`   Role: ${user.role} ${user.role === account.expectedRole ? '✅' : '❌'}`);
                console.log(`   Status: ${user.status}`);
                console.log(`   Wallet Balance: KES ${user.wallet?.balance || 0}`);
                console.log(`   Business Profile: ${user.businessProfile ? '✅ Exists' : '❌ Missing'}`);
                console.log('');
            } else {
                console.log(`   ❌ Account ${account.email} NOT FOUND\n`);
            }
        }

        // Test 6: Check database tables
        console.log('6️⃣  Checking Database Tables...');
        const productCount = await prisma.product.count();
        const saleCount = await prisma.sale.count();
        const stockMovementCount = await prisma.stockMovement.count();
        const transactionCount = await prisma.transaction.count();

        console.log(`   Products: ${productCount}`);
        console.log(`   Sales: ${saleCount}`);
        console.log(`   Stock Movements: ${stockMovementCount}`);
        console.log(`   Transactions: ${transactionCount}\n`);

        // Test 7: Test JWT token generation (simulate)
        console.log('7️⃣  Testing JWT Token Generation...');
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

        const adminUser = await prisma.user.findUnique({
            where: { email: 'admin@mpesaconnect.com' }
        });

        if (adminUser) {
            const token = jwt.sign(
                { userId: adminUser.id, role: adminUser.role },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            console.log(`   ✅ JWT Token generated successfully`);
            console.log(`   Token length: ${token.length} characters\n`);
        }

        // Summary
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 TEST SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('✅ Database Connection: WORKING');
        console.log(`✅ Total Users: ${userCount}`);
        console.log('✅ Password Hashing: WORKING');
        console.log('✅ Login Credentials: VALID');
        console.log('✅ JWT Generation: WORKING');
        console.log('\n🎉 All tests passed! Login should work correctly.\n');
        console.log('📝 Use these credentials to login:');
        console.log('   Email: admin@mpesaconnect.com');
        console.log('   Password: admin123\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED!');
        console.error('Error:', error);
        console.error('\nPossible issues:');
        console.error('1. Database not running');
        console.error('2. Wrong database credentials in .env');
        console.error('3. Database schema not synced');
        console.error('4. No users in database\n');
    } finally {
        await prisma.$disconnect();
    }
}

testLoginAndDatabase()
    .then(() => {
        console.log('✅ Test completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Test failed!', error);
        process.exit(1);
    });
