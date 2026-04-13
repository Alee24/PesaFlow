"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const email = 'tester@example.com';
    const password = 'password123';
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            phoneNumber: '254712345678',
            passwordHash: hashedPassword,
            role: 'MERCHANT',
            status: 'ACTIVE'
        },
    });
    console.log(`Test user created/found:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
//# sourceMappingURL=create-test-user.js.map
