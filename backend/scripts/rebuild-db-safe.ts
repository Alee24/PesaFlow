
import { PrismaClient } from '@prisma/client';
// Connect to the server without specifying a database
const p = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:@localhost:3306/'
    }
  }
});

async function run() {
    console.log('Connecting to MySQL server...');
    await p.$executeRawUnsafe('DROP DATABASE IF EXISTS mpesaconnect');
    console.log('Database mpesaconnect dropped.');
    await p.$executeRawUnsafe('CREATE DATABASE mpesaconnect');
    console.log('Database mpesaconnect created.');
}
run().catch(e => console.error(e)).finally(() => p.$disconnect());
