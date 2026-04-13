
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
    console.log('Fetching all tables to drop...');
    const result: any[] = await p.$queryRawUnsafe('SHOW TABLES'); 
    console.log('Found tables:', result);
    
    // Extract table names
    const tables = result.map(t => Object.values(t)[0]);
    if (tables.length === 0) {
        console.log('No tables found to drop.');
        return;
    }
    
    console.log(`Dropping tables: ${tables.join(', ')}`);
    await p.$executeRawUnsafe(`DROP TABLE IF EXISTS ${tables.join(', ')}`);
    console.log('All tables dropped.');
}
run().catch(e => console.error(e)).finally(() => p.$disconnect());
