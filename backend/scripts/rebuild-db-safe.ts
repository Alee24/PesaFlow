
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
    await p.$executeRawUnsafe('DROP DATABASE IF EXISTS pesaflow');
    console.log('Database pesaflow dropped.');
    await p.$executeRawUnsafe('CREATE DATABASE pesaflow');
    console.log('Database pesaflow created.');
}
run().catch(e => console.error(e)).finally(() => p.$disconnect());
