
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env from backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

function generateLicenseKey() {
    const prefix = 'ENT';
    const random = crypto.randomBytes(16).toString('hex').toUpperCase();
    const checksum = crypto.createHash('sha256').update(random).digest('hex').substring(0, 4).toUpperCase();
    const formatted = random.match(/.{1,4}/g)?.join('-') || random;
    return `${prefix}-${formatted}-${checksum}`;
}

async function main() {
    console.log('🔌 Connecting to database...');
    // Mask password in log
    const dbUrl = process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@');
    console.log(`📝 Using Database: ${dbUrl}`);

    const key = generateLicenseKey();

    // 1. Create
    await prisma.userLicenseKey.create({
        data: {
            licenseKey: key,
            planType: 'ENTERPRISE',
            generatedBy: 'CLI-TEST',
            expiresAt: null
        }
    });

    // 2. Verify
    const verify = await prisma.userLicenseKey.findUnique({
        where: { licenseKey: key }
    });

    if (verify) {
        console.log('\n✅ SUCCESS: Key created and verified in DB!');
        console.log('=================================');
        console.log(`\n${key}\n`);
        console.log('=================================');
    } else {
        console.error('\n❌ ERROR: Key was created but could not be found immediately. Something is wrong.');
    }
}

main()
    .catch(e => {
        console.error('\n❌ FATAL ERROR:', e);
    })
    .finally(async () => await prisma.$disconnect());
