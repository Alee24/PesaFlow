
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateLicenseKey() {
    const prefix = 'ENT';
    const random = crypto.randomBytes(16).toString('hex').toUpperCase();
    const checksum = crypto.createHash('sha256').update(random).digest('hex').substring(0, 4).toUpperCase();
    const formatted = random.match(/.{1,4}/g)?.join('-') || random;
    return `${prefix}-${formatted}-${checksum}`;
}

async function main() {
    const key = generateLicenseKey();

    await prisma.userLicenseKey.create({
        data: {
            licenseKey: key,
            planType: 'ENTERPRISE',
            generatedBy: 'CLI-TEST',
            expiresAt: null // Never expires
        }
    });

    console.log('\n✨ TEST LICENSE KEY GENERATED ✨');
    console.log('=================================');
    console.log(`\n${key}\n`);
    console.log('=================================');
    console.log('Copy and paste this into the activation page.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
