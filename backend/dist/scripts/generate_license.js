"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
function generateLicenseKey() {
    const prefix = 'ENT';
    const random = crypto_1.default.randomBytes(16).toString('hex').toUpperCase();
    const checksum = crypto_1.default.createHash('sha256').update(random).digest('hex').substring(0, 4).toUpperCase();
    const formatted = random.match(/.{1,4}/g)?.join('-') || random;
    return `${prefix}-${formatted}-${checksum}`;
}
async function main() {
    const args = process.argv.slice(2);
    const count = parseInt(args[0]) || 1;
    const planType = args[1] || 'ENTERPRISE';
    console.log(`🔐 Generating ${count} ${planType} license key(s)...`);
    console.log('------------------------------------------------');
    for (let i = 0; i < count; i++) {
        const licenseKey = generateLicenseKey();
        await prisma.userLicenseKey.create({
            data: {
                licenseKey,
                planType,
                generatedBy: 'CLI_SCRIPT',
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            }
        });
        console.log(`✅ Key: ${licenseKey}`);
    }
    console.log('------------------------------------------------');
    console.log('Generated successfully. These keys are now valid for activation.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=generate_license.js.map
