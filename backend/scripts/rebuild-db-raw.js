
const { Client } = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const conn = await Client.createConnection({
        host: 'localhost',
        user: 'root',
        password: '' // from env normally, but root/empty based on the .env I saw
    });
    
    console.log('Dropping database mpesaconnect...');
    await conn.query('DROP DATABASE IF EXISTS mpesaconnect');
    console.log('Creating database mpesaconnect...');
    await conn.query('CREATE DATABASE mpesaconnect');
    console.log('Database reconstructed.');
    await conn.end();
}
run().catch(e => console.error(e));
