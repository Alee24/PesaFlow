
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
    console.log('Dropping database mpesaconnect...');
    await p.$executeRawUnsafe('DROP DATABASE IF EXISTS mpesaconnect');
    console.log('Creating database mpesaconnect...');
    await p.$executeRawUnsafe('CREATE DATABASE mpesaconnect');
    console.log('Database reconstructed.');
}
run().catch(e => console.error(e)).finally(() => p.$disconnect());
