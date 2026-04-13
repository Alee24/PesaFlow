"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
require('dotenv').config({ path: path_1.default.join(__dirname, '../../.env') });
const prisma = new client_1.PrismaClient();
async function fixWallets() {
    console.log("🔧 Fixing Missing Wallets...");
    const users = await prisma.user.findMany({
        include: { wallet: true }
    });
    for (const user of users) {
        if (!user.wallet) {
            console.log(`   🔸 User '${user.email}' has NO wallet. Creating...`);
            await prisma.wallet.create({
                data: {
                    userId: user.id,
                    balance: 0
                }
            });
            console.log("      ✅ Wallet created.");
        }
        else {
            console.log(`   🔹 User '${user.email}' has wallet.`);
        }
    }
    await prisma.$disconnect();
}
fixWallets();
//# sourceMappingURL=fix-wallets.js.map
