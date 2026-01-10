// Script to manually mark a pending M-Pesa sale as PAID
// Run with: npx ts-node backend/scripts/mark-sale-paid.ts <sale-id>

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function markSalePaid(saleId: string) {
    console.log(`🔄 Attempting to mark sale ${saleId} as PAID...\n`);

    const sale = await prisma.sale.findUnique({
        where: { id: saleId },
        include: {
            transaction: true,
            merchant: true
        }
    });

    if (!sale) {
        console.error('❌ Sale not found!');
        await prisma.$disconnect();
        return;
    }

    console.log(`📋 Sale Details:`);
    console.log(`   Amount: KES ${sale.totalAmount}`);
    console.log(`   Current Status: ${sale.paymentStatus}`);
    console.log(`   Payment Method: ${sale.paymentMethod}`);
    console.log(`   Merchant: ${sale.merchant.name || sale.merchant.email}`);

    if (sale.paymentStatus === 'PAID') {
        console.log('\n✅ Sale is already marked as PAID!');
        await prisma.$disconnect();
        return;
    }

    // Fetch service charge settings
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
        settings = await prisma.systemSettings.create({
            data: {
                serviceChargeEnabled: true,
                serviceChargeAmount: 2.5
            }
        });
    }

    const fee = settings.serviceChargeEnabled ? settings.serviceChargeAmount : 0;
    const amount = Number(sale.totalAmount);
    const creditAmount = amount - fee;

    // Update sale
    await prisma.sale.update({
        where: { id: saleId },
        data: {
            paymentStatus: 'PAID',
            amountPaid: amount.toString()
        }
    });

    // Update transaction if exists
    if (sale.transaction) {
        await prisma.transaction.update({
            where: { id: sale.transaction.id },
            data: {
                status: 'COMPLETED',
                feeCharged: fee
            }
        });

        // Credit wallet
        await prisma.wallet.update({
            where: { id: sale.transaction.recipientWalletId },
            data: {
                balance: { increment: creditAmount }
            }
        });

        console.log(`\n✅ Sale marked as PAID!`);
        console.log(`   Service Charge: KES ${fee}`);
        console.log(`   Credited to Wallet: KES ${creditAmount}`);
    } else {
        console.log(`\n⚠️  Sale updated but no transaction found to credit wallet`);
    }

    await prisma.$disconnect();
}

const saleId = process.argv[2];
if (!saleId) {
    console.error('Usage: npx ts-node backend/scripts/mark-sale-paid.ts <sale-id>');
    process.exit(1);
}

markSalePaid(saleId).catch(console.error);
