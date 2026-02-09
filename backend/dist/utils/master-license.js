"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMasterLicense = generateMasterLicense;
exports.validateMasterLicense = validateMasterLicense;
const crypto_1 = __importDefault(require("crypto"));
const MASTER_SECRET = process.env.MASTER_LICENSE_SECRET || 'CHANGE-THIS-ULTRA-SECRET-KEY-2026';
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_VERSION = 'v2';
function deriveKey(secret) {
    return crypto_1.default.scryptSync(secret, 'salt-mpesa-connect-2026', 32);
}
function generateSignature(data) {
    const hmac = crypto_1.default.createHmac('sha512', MASTER_SECRET);
    hmac.update(data);
    return hmac.digest('hex');
}
function verifySignature(data, signature) {
    const expectedSignature = generateSignature(data);
    return crypto_1.default.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
}
function encrypt(data) {
    const key = deriveKey(MASTER_SECRET);
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}
function decrypt(encryptedData) {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const key = deriveKey(MASTER_SECRET);
    const decipher = crypto_1.default.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
function generateMasterLicense(issuedTo, durationDays = 36500, maxInstallations = 999999) {
    const now = Date.now();
    const expiresAt = now + (durationDays * 24 * 60 * 60 * 1000);
    const licenseData = {
        version: KEY_VERSION,
        type: 'MASTER',
        issuedTo,
        issuedAt: now,
        expiresAt,
        maxInstallations,
        features: ['all', 'unlimited', 'master'],
        signature: ''
    };
    const dataToSign = JSON.stringify({
        version: licenseData.version,
        type: licenseData.type,
        issuedTo: licenseData.issuedTo,
        issuedAt: licenseData.issuedAt,
        expiresAt: licenseData.expiresAt,
        maxInstallations: licenseData.maxInstallations,
        features: licenseData.features
    });
    licenseData.signature = generateSignature(dataToSign);
    const encryptedLicense = encrypt(JSON.stringify(licenseData));
    const base64License = Buffer.from(encryptedLicense).toString('base64');
    const checksum = crypto_1.default.createHash('sha256').update(base64License).digest('hex').substring(0, 8);
    return `MPESA-MASTER-${KEY_VERSION}-${checksum}-${base64License}`;
}
function validateMasterLicense(licenseKey) {
    try {
        if (!licenseKey.startsWith('MPESA-MASTER-')) {
            return { valid: false, error: 'Invalid license format' };
        }
        const parts = licenseKey.split('-');
        if (parts.length < 5) {
            return { valid: false, error: 'Invalid license structure' };
        }
        const version = parts[2];
        const checksum = parts[3];
        const base64License = parts.slice(4).join('-');
        const expectedChecksum = crypto_1.default.createHash('sha256').update(base64License).digest('hex').substring(0, 8);
        if (checksum !== expectedChecksum) {
            return { valid: false, error: 'License checksum failed - possible tampering' };
        }
        const encryptedLicense = Buffer.from(base64License, 'base64').toString();
        const decryptedData = decrypt(encryptedLicense);
        const licenseData = JSON.parse(decryptedData);
        const dataToVerify = JSON.stringify({
            version: licenseData.version,
            type: licenseData.type,
            issuedTo: licenseData.issuedTo,
            issuedAt: licenseData.issuedAt,
            expiresAt: licenseData.expiresAt,
            maxInstallations: licenseData.maxInstallations,
            features: licenseData.features
        });
        if (!verifySignature(dataToVerify, licenseData.signature)) {
            return { valid: false, error: 'License signature verification failed' };
        }
        if (licenseData.version !== KEY_VERSION) {
            return { valid: false, error: 'Unsupported license version' };
        }
        if (licenseData.type !== 'MASTER') {
            return { valid: false, error: 'Not a master license' };
        }
        if (Date.now() > licenseData.expiresAt) {
            return { valid: false, error: 'License has expired' };
        }
        return {
            valid: true,
            data: licenseData
        };
    }
    catch (error) {
        return {
            valid: false,
            error: `License validation failed: ${error.message}`
        };
    }
}
if (require.main === module) {
    console.log('\n🔐 MASTER LICENSE KEY GENERATOR\n');
    console.log('='.repeat(60));
    const masterKey = generateMasterLicense('KK Dynamic Enterprise Solutions LTD', 36500, 999999);
    console.log('\n✅ MASTER LICENSE KEY GENERATED:\n');
    console.log(masterKey);
    console.log('\n' + '='.repeat(60));
    const validation = validateMasterLicense(masterKey);
    if (validation.valid && validation.data) {
        console.log('\n✅ LICENSE VALIDATION: PASSED\n');
        console.log('Issued To:', validation.data.issuedTo);
        console.log('Type:', validation.data.type);
        console.log('Issued:', new Date(validation.data.issuedAt).toISOString());
        console.log('Expires:', new Date(validation.data.expiresAt).toISOString());
        console.log('Max Installations:', validation.data.maxInstallations);
        console.log('Features:', validation.data.features.join(', '));
    }
    else {
        console.log('\n❌ LICENSE VALIDATION: FAILED');
        console.log('Error:', validation.error);
    }
    console.log('\n' + '='.repeat(60));
    console.log('\n⚠️  SECURITY NOTES:');
    console.log('1. Keep this master key SECRET');
    console.log('2. Change MASTER_LICENSE_SECRET in .env');
    console.log('3. Never commit secrets to Git');
    console.log('4. This key can activate unlimited installations');
    console.log('5. Store securely - treat like a password\n');
}
exports.default = {
    generateMasterLicense,
    validateMasterLicense
};
//# sourceMappingURL=master-license.js.map