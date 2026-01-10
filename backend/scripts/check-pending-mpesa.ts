// Script to check and manually update pending M-Pesa transactions
// Run with: npx ts-node backend/scripts/check-pending-mpesa.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPendingTransactions() {
    console.log('🔍 Checking pending M-Pesa transactions...\n');

    // Find all pending sales with M-Pesa payment method
    const pendingSales = await prisma.sale.findMany({
        where: {
            paymentMethod: 'MPESA_STK',
            paymentStatus: 'PENDING'
        },
        include: {
            transaction: true,
            merchant: {
                select: {
                    name: true,
                    email: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 20
    });

    console.log(`Found ${pendingSales.length} pending M-Pesa sales:\n`);

    for (const sale of pendingSales) {
        console.log(`📋 Sale ID: ${sale.id.substring(0, 8)}`);
        console.log(`   Amount: KES ${sale.totalAmount}`);
        console.log(`   Date: ${sale.createdAt.toLocaleString()}`);
        console.log(`   Merchant: ${sale.merchant.name || sale.merchant.email}`);
        console.log(`   Customer Phone: ${sale.customerPhone || 'N/A'}`);

        if (sale.transaction) {
            console.log(`   Transaction ID: ${sale.transaction.id.substring(0, 8)}`);
            console.log(`   Transaction Status: ${sale.transaction.status}`);
            console.log(`   Merchant Request ID: ${sale.transaction.merchantRequestId || 'N/A'}`);
        } else {
            console.log(`   ⚠️  No transaction linked!`);
        }
        console.log('');
    }

    // Check callback URL configuration
    console.log('\n📡 Checking M-Pesa Callback Configuration:');
    console.log(`   Callback URL: ${process.env.MPESA_CALLBACK_URL || process.env.APP_URL + '/api/mpesa/callback'}`);
    console.log(`   Environment: ${process.env.MPESA_ENV || 'sandbox'}`);

    await prisma.$disconnect();
}

checkPendingTransactions().catch(console.error);
