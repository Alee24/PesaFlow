
const { Client } = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const conn = await Client.createConnection({
        host: 'localhost',
        user: 'root',
        password: '' // from env normally, but root/empty based on the .env I saw
    });
    
    console.log('Dropping database Mpesa Connect...');
    await conn.query('DROP DATABASE IF EXISTS Mpesa Connect');
    console.log('Creating database Mpesa Connect...');
    await conn.query('CREATE DATABASE Mpesa Connect');
    console.log('Database reconstructed.');
    await conn.end();
}
run().catch(e => console.error(e));
