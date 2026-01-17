
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixInvoiceStats() {
    console.log('Starting Invoice Stats Fix...');

    try {
        // 1. Find all 'INVOICE' transactions that are 'COMPLETED' (Paid)
        const paidInvoices = await prisma.transaction.findMany({
            where: {
                type: 'INVOICE',
                status: { in: ['COMPLETED', 'PAID'] }
            }
        });

        console.log(`Found ${paidInvoices.length} paid invoices.`);

        for (const invoice of paidInvoices) {
            // 2. Find the linked Sale record
            // Sale links to Transaction via transactionId
            const sale = await prisma.sale.findUnique({
                where: { transactionId: invoice.id }
            });

            if (sale) {
                // 3. Check if Sale is showing as PENDING or PARTIAL
                if (sale.paymentStatus !== 'PAID') {
                    console.log(`Fixing Sale ${sale.id} for Invoice ${invoice.reference}...`);

                    await prisma.sale.update({
                        where: { id: sale.id },
                        data: {
                            paymentStatus: 'PAID',
                            amountPaid: invoice.amount, // Set amountPaid to full amount
                            amountDue: 0
                        }
                    });
                    console.log(`   -> Marked as PAID.`);
                } else {
                    // console.log(`   Sale ${sale.id} is already correct.`);
                }
            } else {
                console.warn(`Original Sales record for Invoice ${invoice.id} not found.`);
            }
        }

        console.log('--------------------------------------------------');
        console.log('Also checking for Invoice Payments (STK Push) to link to original Sales...');

        // 4. Find STK Push payments that were for Invoices
        // These transactions have metadata.invoiceId
        const stkPayments = await prisma.transaction.findMany({
            where: {
                type: 'DEPOSIT_STK',
                status: 'COMPLETED'
            }
        });

        for (const payment of stkPayments) {
            if (payment.metadata) {
                try {
                    const meta = JSON.parse(payment.metadata);
                    if (meta.invoiceId) {
                        // This payment was for an invoice. Ensure that invoice's sale is PAID.
                        const originalInvoiceTx = await prisma.transaction.findUnique({
                            where: { id: meta.invoiceId }
                        });

                        if (originalInvoiceTx) {
                            // Mark Original Transaction as Completed if not already
                            if (originalInvoiceTx.status !== 'COMPLETED') {
                                console.log(`Marking Invoice Transaction ${originalInvoiceTx.id} as COMPLETED (found payment ${payment.id})`);
                                await prisma.transaction.update({
                                    where: { id: originalInvoiceTx.id },
                                    data: { status: 'COMPLETED' }
                                });
                            }

                            // Mark Original Sale as Paid
                            const originalSale = await prisma.sale.findUnique({
                                where: { transactionId: originalInvoiceTx.id }
                            });

                            if (originalSale && originalSale.paymentStatus !== 'PAID') {
                                console.log(`Marking Invoice Sale ${originalSale.id} as PAID (found payment ${payment.id})`);
                                await prisma.sale.update({
                                    where: { id: originalSale.id },
                                    data: {
                                        paymentStatus: 'PAID',
                                        amountPaid: originalSale.totalAmount,
                                        amountDue: 0
                                    }
                                });
                            }
                        }
                    }
                } catch (e) {
                    // ignore JSON parse errors
                }
            }
        }

        console.log('Fix Complete.');

    } catch (error) {
        console.error('Error running fix:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixInvoiceStats();
