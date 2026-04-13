"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function fixInvoiceStats() {
    console.log('Starting Invoice Stats Fix...');
    try {
        const paidInvoices = await prisma.transaction.findMany({
            where: {
                type: 'INVOICE',
                status: { in: ['COMPLETED', 'PAID'] }
            }
        });
        console.log(`Found ${paidInvoices.length} paid invoices.`);
        for (const invoice of paidInvoices) {
            const sale = await prisma.sale.findUnique({
                where: { transactionId: invoice.id }
            });
            if (sale) {
                if (sale.paymentStatus !== 'PAID') {
                    console.log(`Fixing Sale ${sale.id} for Invoice ${invoice.reference}...`);
                    await prisma.sale.update({
                        where: { id: sale.id },
                        data: {
                            paymentStatus: 'PAID',
                            amountPaid: invoice.amount,
                            amountDue: 0
                        }
                    });
                    console.log(`   -> Marked as PAID.`);
                }
                else {
                }
            }
            else {
                console.warn(`Original Sales record for Invoice ${invoice.id} not found.`);
            }
        }
        console.log('--------------------------------------------------');
        console.log('Also checking for Invoice Payments (STK Push) to link to original Sales...');
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
                        const originalInvoiceTx = await prisma.transaction.findUnique({
                            where: { id: meta.invoiceId }
                        });
                        if (originalInvoiceTx) {
                            if (originalInvoiceTx.status !== 'COMPLETED') {
                                console.log(`Marking Invoice Transaction ${originalInvoiceTx.id} as COMPLETED (found payment ${payment.id})`);
                                await prisma.transaction.update({
                                    where: { id: originalInvoiceTx.id },
                                    data: { status: 'COMPLETED' }
                                });
                            }
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
                }
                catch (e) {
                }
            }
        }
        console.log('Recalculating Customer LTV...');
        const customerStats = await prisma.sale.groupBy({
            by: ['customerId'],
            where: {
                paymentStatus: 'PAID',
                customerId: { not: null }
            },
            _sum: {
                totalAmount: true
            },
            _count: {
                id: true
            },
            _max: {
                createdAt: true
            }
        });
        for (const stat of customerStats) {
            if (stat.customerId) {
                await prisma.customer.update({
                    where: { id: stat.customerId },
                    data: {
                        lifetimeValue: stat._sum.totalAmount || 0,
                        totalPurchases: stat._count.id,
                        lastPurchaseDate: stat._max.createdAt || undefined
                    }
                });
                console.log(`Updated Customer ${stat.customerId} stats: LTV ${stat._sum.totalAmount}`);
            }
        }
        console.log('Fix Complete.');
    }
    catch (error) {
        console.error('Error running fix:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
fixInvoiceStats();
//# sourceMappingURL=fix_invoice_stats.js.map
