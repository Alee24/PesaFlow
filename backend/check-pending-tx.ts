
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPending() {
    const transaction = await prisma.transaction.findFirst({
        where: {
            type: 'DEPOSIT_STK',
            status: 'PENDING'
        },
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { email: true } }
        }
    });

    if (transaction) {
        console.log('Found Pending Transaction:');
        console.log(`ID: ${transaction.id}`);
        console.log(`Amount: ${transaction.amount}`);
        console.log(`Merchant Request ID: ${transaction.merchantRequestId}`);
        console.log(`Checkout Request ID: ${transaction.checkoutRequestId}`);
        console.log(`User: ${transaction.user.email}`);
    } else {
        console.log('No PENDING transactions found.');
    }
}

checkPending()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
