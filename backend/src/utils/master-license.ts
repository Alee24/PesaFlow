import crypto from 'crypto';

/**
 * MASTER LICENSE KEY SYSTEM
 * This generates and validates ultra-secure master license keys
 * that can be used on multiple installations
 */

// CRITICAL: Change these secrets in production and NEVER commit to Git
const MASTER_SECRET = process.env.MASTER_LICENSE_SECRET || 'CHANGE-THIS-ULTRA-SECRET-KEY-2026';
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_VERSION = 'v2';

interface MasterLicenseData {
    version: string;
    type: 'MASTER' | 'STANDARD';
    issuedTo: string;
    issuedAt: number;
    expiresAt: number;
    maxInstallations: number;
    features: string[];
    signature: string;
}

/**
 * Generate encryption key from master secret
 */
function deriveKey(secret: string): Buffer {
    return crypto.scryptSync(secret, 'salt-mpesa-connect-2026', 32);
}

/**
 * Generate a cryptographic signature
 */
function generateSignature(data: string): string {
    const hmac = crypto.createHmac('sha512', MASTER_SECRET);
    hmac.update(data);
    return hmac.digest('hex');
}

/**
 * Verify signature
 */
function verifySignature(data: string, signature: string): boolean {
    const expectedSignature = generateSignature(data);
    return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
    );
}

/**
 * Encrypt data with AES-256-GCM
 */
function encrypt(data: string): string {
    const key = deriveKey(MASTER_SECRET);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV + AuthTag + Encrypted Data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt data with AES-256-GCM
 */
function decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const key = deriveKey(MASTER_SECRET);
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Generate a Master License Key
 */
export function generateMasterLicense(
    issuedTo: string,
    durationDays: number = 36500, // 100 years default
    maxInstallations: number = 999999 // Unlimited
): string {
    const now = Date.now();
    const expiresAt = now + (durationDays * 24 * 60 * 60 * 1000);

    const licenseData: MasterLicenseData = {
        version: KEY_VERSION,
        type: 'MASTER',
        issuedTo,
        issuedAt: now,
        expiresAt,
        maxInstallations,
        features: ['all', 'unlimited', 'master'],
        signature: ''
    };

    // Generate signature
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

    // Encrypt the entire license
    const encryptedLicense = encrypt(JSON.stringify(licenseData));

    // Encode to Base64 for easy copy-paste
    const base64License = Buffer.from(encryptedLicense).toString('base64');

    // Add prefix and checksum
    const checksum = crypto.createHash('sha256').update(base64License).digest('hex').substring(0, 8);

    return `MPESA-MASTER-${KEY_VERSION}-${checksum}-${base64License}`;
}

/**
 * Validate a Master License Key
 */
export function validateMasterLicense(licenseKey: string): {
    valid: boolean;
    data?: MasterLicenseData;
    error?: string;
} {
    try {
        // Check format
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

        // Verify checksum
        const expectedChecksum = crypto.createHash('sha256').update(base64License).digest('hex').substring(0, 8);
        if (checksum !== expectedChecksum) {
            return { valid: false, error: 'License checksum failed - possible tampering' };
        }

        // Decode from Base64
        const encryptedLicense = Buffer.from(base64License, 'base64').toString();

        // Decrypt
        const decryptedData = decrypt(encryptedLicense);
        const licenseData: MasterLicenseData = JSON.parse(decryptedData);

        // Verify signature
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

        // Check version
        if (licenseData.version !== KEY_VERSION) {
            return { valid: false, error: 'Unsupported license version' };
        }

        // Check type
        if (licenseData.type !== 'MASTER') {
            return { valid: false, error: 'Not a master license' };
        }

        // Check expiration
        if (Date.now() > licenseData.expiresAt) {
            return { valid: false, error: 'License has expired' };
        }

        return {
            valid: true,
            data: licenseData
        };
    } catch (error: any) {
        return {
            valid: false,
            error: `License validation failed: ${error.message}`
        };
    }
}

/**
 * CLI Tool - Generate Master License
 */
if (require.main === module) {
    console.log('\n🔐 MASTER LICENSE KEY GENERATOR\n');
    console.log('='.repeat(60));

    // Generate a master license
    const masterKey = generateMasterLicense(
        'KK Dynamic Enterprise Solutions LTD',
        36500, // 100 years
        999999 // Unlimited installations
    );

    console.log('\n✅ MASTER LICENSE KEY GENERATED:\n');
    console.log(masterKey);
    console.log('\n' + '='.repeat(60));

    // Validate it
    const validation = validateMasterLicense(masterKey);

    if (validation.valid && validation.data) {
        console.log('\n✅ LICENSE VALIDATION: PASSED\n');
        console.log('Issued To:', validation.data.issuedTo);
        console.log('Type:', validation.data.type);
        console.log('Issued:', new Date(validation.data.issuedAt).toISOString());
        console.log('Expires:', new Date(validation.data.expiresAt).toISOString());
        console.log('Max Installations:', validation.data.maxInstallations);
        console.log('Features:', validation.data.features.join(', '));
    } else {
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

export default {
    generateMasterLicense,
    validateMasterLicense
};
