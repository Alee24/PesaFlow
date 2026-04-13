
const { PrismaClient } = require('@prisma/client');

async function testConnection(url) {
    console.log(`Testing: ${url.replace(/:[^:@]*@/, ':****@')}`);
    const prisma = new PrismaClient({
        datasources: { db: { url } },
        log: ['error']
    });
    try {
        await prisma.$connect();
        console.log("   ✅ SUCCESS!");
        await prisma.$disconnect();
        return true;
    } catch (e) {
        console.log("   ❌ Failed:", e.message.split('\n').pop()); // Log only the last line (usually the error code)
        return false;
    }
}

async function main() {
    const dbName = 'mpesa_saas';
    const currentUrl = process.env.DATABASE_URL || "mysql://root:asdasdsadw22@localhost:3306/mpesa_saas";

    console.log("--- DIAGONISING DATABASE CONNECTION ---");

    // 1. Test Current Config
    if (await testConnection(currentUrl)) return;

    // 2. Test No Password
    if (await testConnection(`mysql://root:@localhost:3306/${dbName}`)) {
        console.log("\n>>> FIX FOUND: Your local database has NO PASSWORD. Update .env to remove it.");
        return;
    }

    // 3. Test 'root' Password
    if (await testConnection(`mysql://root:root@localhost:3306/${dbName}`)) {
        console.log("\n>>> FIX FOUND: Your local database password is 'root'. Update .env.");
        return;
    }

    console.log("\n⚠️  COULD NOT CONNECT. Please check if MySQL (XAMPP/WAMP) is running.");
}

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
main();
