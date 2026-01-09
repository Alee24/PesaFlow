
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPending() {
    try {
        const transaction = await prisma.transaction.findFirst({
            where: {
                type: 'DEPOSIT_STK',
                status: 'PENDING'
            },
            orderBy: { createdAt: 'desc' },
            include: {
                initiator: { select: { email: true } }
            }
        });

        if (transaction) {
            console.log('Found Pending Transaction:');
            console.log(`ID: ${transaction.id}`);
            console.log(`Amount: ${transaction.amount}`);
            console.log(`Merchant Request ID: ${transaction.merchantRequestId}`);
            console.log(`Checkout Request ID: ${transaction.checkoutRequestId}`);
            console.log(`User: ${transaction.initiator?.email}`);
        } else {
            console.log('No PENDING transactions found.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkPending();
