
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log("--- Manual Operations Script ---");

    // 1. Generate Clean SQL File
    console.log("1. Generating clean database_schema.sql...");
    exec('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', { cwd: path.join(__dirname, '../../') }, (err, stdout, stderr) => {
        if (err) {
            console.error("Failed to generate SQL:", err);
            return;
        }

        const sqlPath = path.join(__dirname, '../../database_schema.sql');
        fs.writeFileSync(sqlPath, stdout, { encoding: 'utf8' });
        console.log("   ✅ database_schema.sql generated (UTF-8) at " + sqlPath);
    });

    // 2. Create Super Admin User
    const email = 'mettoalex@gmail.com';
    const password = 'Digital2025';

    console.log(`2. Creating Super Admin (${email})...`);

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if exists
        const existing = await prisma.user.findUnique({ where: { email } });

        if (existing) {
            console.log("   ⚠️ User already exists. Updating role/password...");
            await prisma.user.update({
                where: { email },
                data: {
                    passwordHash: hashedPassword,
                    role: 'ADMIN',
                    status: 'ACTIVE'
                }
            });
        } else {
            await prisma.user.create({
                data: {
                    email,
                    passwordHash: hashedPassword,
                    role: 'ADMIN',
                    name: 'Super Admin',
                    phoneNumber: '0700000000', // Placeholder
                    status: 'ACTIVE',
                    wallet: { create: { balance: 0 } },
                    businessProfile: { create: { companyName: 'Metto Admin' } }
                }
            });
        }
        console.log("   ✅ Super Admin created/updated successfully.");

        // 3. Print SQL for VPS
        console.log("\n--- SQL FOR VPS ADMIN CREATION ---");
        console.log("Run this in your VPS phpMyAdmin AFTER importing database_schema.sql to create the same user manually:");
        console.log(`
INSERT INTO users (id, email, password_hash, role, status, phone_number, name, created_at, updated_at) 
VALUES (UUID(), '${email}', '${hashedPassword}', 'ADMIN', 'ACTIVE', '0700000000', 'Super Admin', NOW(), NOW());
        `);
        console.log("----------------------------------");

    } catch (e) {
        console.error("   ❌ Failed to create admin:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
