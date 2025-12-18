
const bcrypt = require('bcryptjs');

async function generate() {
    const hash = await bcrypt.hash('Digital2025', 10);
    console.log("HASH:", hash);
    console.log(`
--------------------------------------------------------------------------------
 SQL COMMAND TO RUN IN PHPMYADMIN (SQL TAB):
--------------------------------------------------------------------------------
INSERT INTO users (id, email, password_hash, role, status, phone_number, name, created_at, updated_at) 
VALUES (UUID(), 'mettoalex@gmail.com', '${hash}', 'ADMIN', 'ACTIVE', '0700000000', 'Super Admin', NOW(), NOW());
--------------------------------------------------------------------------------
    `);
}

generate();
