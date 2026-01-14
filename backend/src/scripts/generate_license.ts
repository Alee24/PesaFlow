
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateLicenseKey(): string {
    const prefix = 'ENT'; // Enterprise
    const random = crypto.randomBytes(16).toString('hex').toUpperCase();
    const checksum = crypto.createHash('sha256').update(random).digest('hex').substring(0, 4).toUpperCase();

    // Format: ENT-XXXX-XXXX-XXXX-XXXX-XXXX
    const formatted = random.match(/.{1,4}/g)?.join('-') || random;
    return `${prefix}-${formatted}-${checksum}`;
}

async function main() {
    const args = process.argv.slice(2);
    const count = parseInt(args[0]) || 1;
    const planType = args[1] || 'ENTERPRISE';

    console.log(`🔐 Generating ${count} ${planType} license key(s)...`);
    console.log('------------------------------------------------');

    for (let i = 0; i < count; i++) {
        const licenseKey = generateLicenseKey();

        await prisma.userLicenseKey.create({
            data: {
                licenseKey,
                planType,
                generatedBy: 'CLI_SCRIPT',
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year default
            }
        });

        console.log(`✅ Key: ${licenseKey}`);
    }

    console.log('------------------------------------------------');
    console.log('Generated successfully. These keys are now valid for activation.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
