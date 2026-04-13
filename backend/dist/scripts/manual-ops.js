"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("--- Manual Operations Script ---");
    console.log("1. Generating clean database_schema.sql...");
    (0, child_process_1.exec)('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', { cwd: path_1.default.join(__dirname, '../../') }, (err, stdout, stderr) => {
        if (err) {
            console.error("Failed to generate SQL:", err);
            return;
        }
        const sqlPath = path_1.default.join(__dirname, '../../database_schema.sql');
        fs_1.default.writeFileSync(sqlPath, stdout, { encoding: 'utf8' });
        console.log("   ✅ database_schema.sql generated (UTF-8) at " + sqlPath);
    });
    const email = 'mettoalex@gmail.com';
    const password = 'Digital2025';
    console.log(`2. Creating Super Admin (${email})...`);
    try {
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
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
        }
        else {
            await prisma.user.create({
                data: {
                    email,
                    passwordHash: hashedPassword,
                    role: 'ADMIN',
                    name: 'Super Admin',
                    phoneNumber: '0700000000',
                    status: 'ACTIVE',
                    wallet: { create: { balance: 0 } },
                    businessProfile: { create: { companyName: 'Metto Admin' } }
                }
            });
        }
        console.log("   ✅ Super Admin created/updated successfully.");
        console.log("\n--- SQL FOR VPS ADMIN CREATION ---");
        console.log("Run this in your VPS phpMyAdmin AFTER importing database_schema.sql to create the same user manually:");
        console.log(`
INSERT INTO users (id, email, password_hash, role, status, phone_number, name, created_at, updated_at) 
VALUES (UUID(), '${email}', '${hashedPassword}', 'ADMIN', 'ACTIVE', '0700000000', 'Super Admin', NOW(), NOW());
        `);
        console.log("----------------------------------");
    }
    catch (e) {
        console.error("   ❌ Failed to create admin:", e);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=manual-ops.js.map
