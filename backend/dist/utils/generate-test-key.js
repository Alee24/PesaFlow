"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv.config({ path: path_1.default.join(__dirname, '../../.env') });
const prisma = new client_1.PrismaClient();
function generateLicenseKey() {
    const prefix = 'ENT';
    const random = crypto_1.default.randomBytes(16).toString('hex').toUpperCase();
    const checksum = crypto_1.default.createHash('sha256').update(random).digest('hex').substring(0, 4).toUpperCase();
    const formatted = random.match(/.{1,4}/g)?.join('-') || random;
    return `${prefix}-${formatted}-${checksum}`;
}
async function main() {
    console.log('🔌 Connecting to database...');
    const dbUrl = process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@');
    console.log(`📝 Using Database: ${dbUrl}`);
    const key = generateLicenseKey();
    await prisma.userLicenseKey.create({
        data: {
            licenseKey: key,
            planType: 'ENTERPRISE',
            generatedBy: 'CLI-TEST',
            expiresAt: null
        }
    });
    const verify = await prisma.userLicenseKey.findUnique({
        where: { licenseKey: key }
    });
    if (verify) {
        console.log('\n✅ SUCCESS: Key created and verified in DB!');
        console.log('=================================');
        console.log(`\n${key}\n`);
        console.log('=================================');
    }
    else {
        console.error('\n❌ ERROR: Key was created but could not be found immediately. Something is wrong.');
    }
}
main()
    .catch(e => {
    console.error('\n❌ FATAL ERROR:', e);
})
    .finally(async () => await prisma.$disconnect());
//# sourceMappingURL=generate-test-key.js.map