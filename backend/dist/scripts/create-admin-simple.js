"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const prisma = new client_1.PrismaClient();
async function createSuperAdmin() {
    const email = 'mettoalex@gmail.com';
    const password = 'Digital2025';
    console.log(`Creating/Updating Super Admin (${email})...`);
    try {
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            console.log("   User exists. Updating role/password...");
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
            console.log("   Creating new user...");
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
        console.log("SUCCESS: Super Admin is ready.");
    }
    catch (e) {
        console.error("ERROR:", e.message);
    }
    finally {
        await prisma.$disconnect();
    }
}
createSuperAdmin();
//# sourceMappingURL=create-admin-simple.js.map
