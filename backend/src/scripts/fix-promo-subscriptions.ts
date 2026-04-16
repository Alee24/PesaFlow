/**
 * Migration: Fix 1-Year Promotion Subscriptions
 *
 * Problem: Accounts registered with the "1 Year Promotion" were getting plan='FREE'
 * with an endDate set, but FREE gave no feature access.
 *
 * Fix: Upgrade all subscriptions that are:
 *   - plan = 'FREE'
 *   - status = 'ACTIVE'
 *   - endDate is set (meaning they were meant to be promo accounts)
 *
 * Upgrades them to plan='PRO' with all features for their remaining promo period.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ALL_FEATURES = JSON.stringify([
    'invoices',
    'withdrawals',
    'team',
    'analytics',
    'reports',
    'CRM',
    'ADVANCED_CRM',
    'POS',
    'BANK_INTEGRATION'
]);

async function fixPromoSubscriptions() {
    console.log('🔍 Finding FREE plan accounts with promotional endDate...');

    const promoSubs = await prisma.subscription.findMany({
        where: {
            plan: 'FREE',
            status: 'ACTIVE',
            endDate: { not: null }
        },
        include: {
            merchant: { select: { email: true, id: true } }
        }
    });

    console.log(`📋 Found ${promoSubs.length} account(s) to upgrade:`);

    for (const sub of promoSubs) {
        console.log(`   → [${sub.merchant.email}] plan: FREE → PRO (endDate: ${sub.endDate?.toISOString()})`);

        await prisma.subscription.update({
            where: { id: sub.id },
            data: {
                plan: 'PRO',
                features: ALL_FEATURES
            }
        });

        // Notify the merchant
        await prisma.notification.create({
            data: {
                userId: sub.merchantId,
                title: '🎉 1-Year Promotion Activated',
                message: 'Your account has been upgraded to full PRO access as part of your 1-Year Promotion. All features are now unlocked until your promotion expires.',
                type: 'success'
            }
        });
    }

    console.log(`\n✅ Successfully upgraded ${promoSubs.length} subscription(s) to PRO plan.`);
    await prisma.$disconnect();
}

fixPromoSubscriptions().catch(e => {
    console.error('❌ Migration failed:', e);
    prisma.$disconnect();
    process.exit(1);
});
