import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function activateLicenseForDevelopment() {
    try {
        const licenseKey = 'ENT-C811-8BFE-DD23-C7DB-2D1E-79A7-5100-13D1-27BF';

        // Find the first user (should be the admin/developer)
        const user = await prisma.user.findFirst({
            orderBy: { createdAt: 'asc' }
        });

        if (!user) {
            console.error('❌ No users found in database. Please create a user account first.');
            return;
        }

        console.log(`🔍 Found user: ${user.email}`);

        // Check if license key exists
        const key = await prisma.userLicenseKey.findUnique({
            where: { licenseKey }
        });

        if (!key) {
            console.error('❌ License key not found in database');
            return;
        }

        console.log('✅ License key found');

        // Activate the license
        await prisma.$transaction([
            // Mark key as used
            prisma.userLicenseKey.update({
                where: { id: key.id },
                data: {
                    isUsed: true,
                    usedBy: user.id,
                    usedByEmail: user.email,
                    usedAt: new Date(),
                    serverFingerprint: 'localhost-dev',
                    domain: 'localhost'
                }
            }),
            // Update user with license
            prisma.user.update({
                where: { id: user.id },
                data: {
                    licenseActivated: true,
                    licenseKey: licenseKey,
                    licenseType: 'ACTIVATED',
                    licenseActivatedAt: new Date()
                }
            }),
            // Create/update subscription
            prisma.subscription.upsert({
                where: { merchantId: user.id },
                create: {
                    merchantId: user.id,
                    plan: 'ENTERPRISE',
                    status: 'ACTIVE',
                    features: JSON.stringify(['all']),
                    isEnterprise: true,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
                },
                update: {
                    plan: 'ENTERPRISE',
                    status: 'ACTIVE',
                    features: JSON.stringify(['all']),
                    isEnterprise: true,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                }
            })
        ]);

        console.log('✅ License activated successfully!');
        console.log(`📧 User: ${user.email}`);
        console.log(`🔑 License Key: ${licenseKey}`);
        console.log(`📅 Valid until: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}`);
        console.log(`🎉 Enterprise plan activated!`);

    } catch (error) {
        console.error('❌ Error activating license:', error);
    } finally {
        await prisma.$disconnect();
    }
}

activateLicenseForDevelopment();
