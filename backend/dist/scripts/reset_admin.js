"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const email = 'mettoalex@gmail.com';
    const password = 'Digital2025';
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    console.log('🔄 Resetting admin account...');
    await prisma.user.deleteMany({
        where: { email }
    });
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash: hashedPassword,
            name: 'Metto Alex',
            phoneNumber: '254700000000',
            role: 'ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
            licenseActivated: true,
            licenseType: 'ACTIVATED',
            licenseActivatedAt: new Date()
        },
    });
    await prisma.subscription.upsert({
        where: { merchantId: user.id },
        create: {
            merchantId: user.id,
            plan: 'ENTERPRISE',
            status: 'ACTIVE',
            features: JSON.stringify(['all']),
            isEnterprise: true,
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        },
        update: {
            plan: 'ENTERPRISE',
            status: 'ACTIVE',
            features: JSON.stringify(['all']),
            isEnterprise: true,
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
    });
    console.log('✅ Admin account reset successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Role: ADMIN');
    console.log('📦 Plan: ENTERPRISE');
}
main()
    .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=reset_admin.js.map
