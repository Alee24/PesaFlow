"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProductionEnv = exports.generateSecurityCredential = exports.isPrecomputedSecurityCredential = exports.DARAJA_SANDBOX_PUBLIC_KEY = void 0;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
exports.DARAJA_SANDBOX_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqLcFdVcV7HdEOotsNLoM
PhD74CX1ejzcgfNuiJNy9pTySxbszBBCWxmok3Unul4rX/zyVD/6LDb9nbqRywZI
gR46UOn+tR3vGXXPX6igxgS6DYTaQV8W858yOGLuhowRi5xeQJfczAMU4o+sCxlB
bMCqYs4nzW81fi8iF2OEUdrfJcbamhSnksdgfD/nomWy9MESAz1QufrGBnaRX2N0
CKsi8SNmzsghpfP15VLiIVV8YXPFKtd9sY37FpY28OKGjKG5wdije/bzFL8qEcPD
hqYGuVaGkhX1bkI0iH+UcFtYYrZv/Fyb5jRHXmNLiq4mMG0fMH8ENxNACFtRZTDI
IQIDAQAB
-----END PUBLIC KEY-----`;
const isPrecomputedSecurityCredential = (value) => {
    if (!value || typeof value !== 'string')
        return false;
    const clean = value.trim().replace(/\s+/g, '');
    return clean.length >= 160 && /^[A-Za-z0-9+/=]+$/.test(clean);
};
exports.isPrecomputedSecurityCredential = isPrecomputedSecurityCredential;
const formatAsPem = (certStr) => {
    const trimmed = certStr.trim();
    if (trimmed.includes('BEGIN CERTIFICATE') || trimmed.includes('BEGIN PUBLIC KEY')) {
        return trimmed;
    }
    return `-----BEGIN CERTIFICATE-----\n${trimmed}\n-----END CERTIFICATE-----`;
};
const generateSecurityCredential = (passwordOrCredential, isProduction = false, customCert) => {
    const raw = (passwordOrCredential || '').trim();
    if (!raw) {
        throw new Error('Initiator Password or Security Credential is required. Configure it in Settings → M-Pesa → Initiator Information.');
    }
    if ((0, exports.isPrecomputedSecurityCredential)(raw)) {
        const cleaned = raw.replace(/\s+/g, '');
        console.log(`[Daraja Security] Using pre-computed SecurityCredential (length: ${cleaned.length})`);
        return cleaned;
    }
    let keyOrCert = null;
    if (customCert && customCert.trim().length > 100) {
        try {
            const pem = formatAsPem(customCert);
            crypto_1.default.createPublicKey(pem);
            keyOrCert = pem;
            console.log('[Daraja Security] Using verified custom certificate provided in settings');
        }
        catch (e) {
            console.warn('[Daraja Security] Provided custom certificate failed parse:', e.message);
        }
    }
    if (!keyOrCert && process.env.MPESA_CERT_PATH) {
        try {
            const certPath = path_1.default.resolve(process.env.MPESA_CERT_PATH);
            const fileContent = fs_1.default.readFileSync(certPath, 'utf8');
            if (fileContent && fileContent.length > 100) {
                const pem = formatAsPem(fileContent);
                crypto_1.default.createPublicKey(pem);
                keyOrCert = pem;
                console.log(`[Daraja Security] Using certificate from file: ${certPath}`);
            }
        }
        catch (err) {
            console.warn(`[Daraja Security] Could not load MPESA_CERT_PATH (${process.env.MPESA_CERT_PATH}): ${err.message}`);
        }
    }
    if (!keyOrCert) {
        const certFileName = isProduction ? 'production.cer' : 'sandbox.cer';
        const bundledPath = path_1.default.join(__dirname, '..', 'certs', certFileName);
        try {
            if (fs_1.default.existsSync(bundledPath)) {
                const fileContent = fs_1.default.readFileSync(bundledPath, 'utf8');
                if (fileContent && fileContent.length > 300) {
                    const pem = formatAsPem(fileContent);
                    crypto_1.default.createPublicKey(pem);
                    keyOrCert = pem;
                    console.log(`[Daraja Security] Using valid bundled certificate: ${certFileName}`);
                }
            }
        }
        catch {
        }
    }
    if (!keyOrCert && !isProduction) {
        keyOrCert = exports.DARAJA_SANDBOX_PUBLIC_KEY;
        console.log('[Daraja Security] Using embedded Daraja Sandbox Public Key');
    }
    if (!keyOrCert) {
        throw new Error('Production Daraja certificate is required to encrypt your Initiator Password. ' +
            'Either: 1) Generate a Security Credential on the Safaricom Developer Portal (https://developer.safaricom.co.ke/test_credentials) ' +
            'and paste it into Settings → M-Pesa → Security Credential, or 2) Paste your Production Certificate PEM into Settings.');
    }
    try {
        const encrypted = crypto_1.default.publicEncrypt({
            key: keyOrCert,
            padding: crypto_1.default.constants.RSA_PKCS1_PADDING,
        }, Buffer.from(raw, 'utf8'));
        const result = encrypted.toString('base64');
        console.log(`[Daraja Security] SecurityCredential successfully generated (length: ${result.length})`);
        return result;
    }
    catch (err) {
        console.error('[Daraja Security] RSA encryption failed:', err.message);
        throw new Error(`Failed to encrypt Initiator Password: ${err.message}. ` +
            'Please generate a pre-computed Security Credential from the Safaricom Developer Portal and paste it into Settings → M-Pesa.');
    }
};
exports.generateSecurityCredential = generateSecurityCredential;
const isProductionEnv = (env) => {
    const normalized = (env || '').trim().toLowerCase();
    return normalized === 'production' || normalized === 'live';
};
exports.isProductionEnv = isProductionEnv;
//# sourceMappingURL=daraja-security.js.map