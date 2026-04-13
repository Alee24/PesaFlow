
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();
const prisma = new PrismaClient();

async function dryRunInvoice() {
    console.log('🚀 Starting Invoice Creation Dry Run...\n');

    try {
        // 1. Find the User
        const user = await prisma.user.findFirst({
            where: { email: 'info@kkdes.co.ke' }, // Target the user's email
            include: { wallet: true, businessProfile: true }
        });

        if (!user) {
            console.error('❌ User info@kkdes.co.ke not found!');
            return;
        }
        console.log(`✅ User found: ${user.email} (${user.role})`);

        if (!user.wallet) {
            console.error('❌ Wallet missing for this user!');
            return;
        }
        console.log('✅ Wallet found.');

        // 2. Simulate Input Data
        const invoiceNumber = `TEST-${Date.now()}`;
        const items = [{ price: 100, quantity: 1, description: 'Test Item' }];
        const totalAmount = 100;

        // 3. Try Creating "General Invoice Item"
        console.log('🔄 Attempting to find or create "General Invoice Item"...');
        let genericProduct = await prisma.product.findFirst({
            where: { merchantId: user.id, name: 'General Invoice Item' }
        });

        if (!genericProduct) {
            console.log('   Creating new generic product...');
            genericProduct = await prisma.product.create({
                data: {
                    merchantId: user.id,
                    name: 'General Invoice Item',
                    price: 0,
                    stockQuantity: 999999,
                    status: 'ACTIVE'
                }
            });
            console.log('   ✅ Created generic product.');
        } else {
            console.log('   ✅ Found existing generic product.');
        }

        // 4. Try Creating Transaction
        console.log('🔄 Attempting to create Transaction...');
        const transaction = await prisma.transaction.create({
            data: {
                type: 'INVOICE',
                amount: totalAmount,
                reference: invoiceNumber,
                status: 'PENDING',
                initiatorUserId: user.id,
                recipientWalletId: user.wallet.id,
                metadata: JSON.stringify({ note: 'Dry run test' })
            }
        });
        console.log(`   ✅ Transaction created: ${transaction.id}`);

        // 5. Try Creating Sale
        console.log('🔄 Attempting to create Sale...');
        const sale = await prisma.sale.create({
            data: {
                merchantId: user.id,
                totalAmount: totalAmount,
                transactionId: transaction.id,
                paymentMethod: 'INVOICE',
                items: {
                    create: items.map(item => ({
                        productId: genericProduct!.id,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        subtotal: item.price * item.quantity
                    }))
                }
            }
        });
        console.log(`   ✅ Sale created: ${sale.id}`);

        console.log('\n✅✅ DRY RUN SUCCESSFUL! The invoice system SHOULD work.');
        console.log('   (Cleaning up test data...)');

        // Cleanup
        await prisma.saleItem.deleteMany({ where: { saleId: sale.id } });
        await prisma.sale.delete({ where: { id: sale.id } });
        await prisma.transaction.delete({ where: { id: transaction.id } });
        console.log('   (Cleanup complete)');

    } catch (error: any) {
        console.error('\n❌ DRY RUN FAILED!');
        console.error('   Error Message:', error.message);
        console.error('   Full Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

dryRunInvoice();
