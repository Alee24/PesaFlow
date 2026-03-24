
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.$connect().then(() => {
    console.log('Successfully connected to DB');
    return p.$queryRaw`SHOW TABLES;`;
}).then(tables => {
    console.log('Tables in DB:', tables);
}).catch(e => {
    console.error('Failed to connect or query DB:', e);
}).finally(() => p.$disconnect());
