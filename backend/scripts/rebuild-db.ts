
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
    console.log('Dropping database pesaflow...');
    await p.$executeRawUnsafe('DROP DATABASE IF EXISTS pesaflow');
    console.log('Creating database pesaflow...');
    await p.$executeRawUnsafe('CREATE DATABASE pesaflow');
    console.log('Database reconstructed.');
}
run().catch(e => console.error(e)).finally(() => p.$disconnect());
