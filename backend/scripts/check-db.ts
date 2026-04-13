
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.user.count().then(c => {
    console.log('Users in DB:', c);
}).catch(e => {
    console.error('Prisma Error:', e);
}).finally(() => p.$disconnect());
