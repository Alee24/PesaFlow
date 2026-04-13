
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
    console.log('Dropping database Mpesa Connect...');
    await p.$executeRawUnsafe('DROP DATABASE IF EXISTS Mpesa Connect');
    console.log('Creating database Mpesa Connect...');
    await p.$executeRawUnsafe('CREATE DATABASE Mpesa Connect');
    console.log('Database reconstructed.');
}
run().catch(e => console.error(e)).finally(() => p.$disconnect());
