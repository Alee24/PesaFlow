import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import os from 'os';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Encryption key - store this securely in environment variables
const ENCRYPTION_KEY = process.env.LICENSE_ENCRYPTION_KEY || 'your-32-character-secret-key-here';
const MASTER_LICENSE_SERVER = process.env.MASTER_LICENSE_SERVER || 'https://license.mpesaconnect.co.ke';

interface LicenseData {
    domain: string;
    serverFingerprint: string;
    activatedAt: Date;
    expiresAt: Date;
    maxUsers: number;
    features: string[];
    status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
}

/**
 * Generate a unique server fingerprint based on hardware
 */
export const generateServerFingerprint = (): string => {
    const networkInterfaces = os.networkInterfaces();
    const cpus = os.cpus();

    // Combine multiple hardware identifiers
    const identifiers = [
        os.hostname(),
        os.platform(),
        os.arch(),
        cpus[0]?.model || '',
        Object.values(networkInterfaces)
            .flat()
            .filter(iface => iface && !iface.internal && iface.mac !== '00:00:00:00:00:00')
            .map(iface => iface?.mac)
            .join('-')
    ];

    // Create a hash of all identifiers
    return crypto
        .createHash('sha256')
        .update(identifiers.join('|'))
        .digest('hex');
};

/**
 * Encrypt license data
 */
const encryptLicense = (data: string): string => {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt license data
 */
const decryptLicense = (encryptedData: string): string => {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
};

/**
 * Validate license with master server
 */
const validateWithMasterServer = async (
    domain: string,
    fingerprint: string
): Promise<boolean> => {
    try {
        const response = await fetch(`${MASTER_LICENSE_SERVER}/api/license/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': process.env.MASTER_LICENSE_KEY || ''
            },
            body: JSON.stringify({ domain, fingerprint })
        });

        if (!response.ok) return false;

        const data = await response.json() as { valid?: boolean };
        return data.valid === true;
    } catch (error) {
        console.error('Master server validation failed:', error);
        return false;
    }
};

/**
 * Check if license is valid
 */
export const checkLicense = async (): Promise<{
    valid: boolean;
    license?: LicenseData;
    error?: string;
}> => {
    try {
        // Get current server fingerprint
        const currentFingerprint = generateServerFingerprint();
        const currentDomain = process.env.DOMAIN || 'localhost';

        // Check database for license
        const licenseRecord = await prisma.systemLicense.findFirst({
            where: { domain: currentDomain }
        });

        if (!licenseRecord) {
            return {
                valid: false,
                error: 'NO_LICENSE_FOUND'
            };
        }

        // Decrypt and parse license data
        let licenseData: LicenseData;
        try {
            const decrypted = decryptLicense(licenseRecord.licenseKey);
            licenseData = JSON.parse(decrypted);
        } catch (error) {
            return {
                valid: false,
                error: 'INVALID_LICENSE_FORMAT'
            };
        }

        // Validate server fingerprint
        if (licenseData.serverFingerprint !== currentFingerprint) {
            return {
                valid: false,
                error: 'SERVER_MISMATCH'
            };
        }

        // Validate domain
        if (licenseData.domain !== currentDomain) {
            return {
                valid: false,
                error: 'DOMAIN_MISMATCH'
            };
        }

        // Check expiration
        if (new Date(licenseData.expiresAt) < new Date()) {
            return {
                valid: false,
                error: 'LICENSE_EXPIRED'
            };
        }

        // Check status
        if (licenseData.status !== 'ACTIVE') {
            return {
                valid: false,
                error: 'LICENSE_SUSPENDED'
            };
        }

        // Validate with master server (optional but recommended)
        const masterValidation = await validateWithMasterServer(
            currentDomain,
            currentFingerprint
        );

        if (!masterValidation) {
            return {
                valid: false,
                error: 'MASTER_SERVER_VALIDATION_FAILED'
            };
        }

        return {
            valid: true,
            license: licenseData
        };
    } catch (error: any) {
        console.error('License check error:', error);
        return {
            valid: false,
            error: 'LICENSE_CHECK_FAILED'
        };
    }
};

/**
 * Middleware to protect routes with license check
 */
export const requireValidLicense = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const licenseCheck = await checkLicense();

    if (!licenseCheck.valid) {
        return res.status(403).json({
            error: 'License validation failed',
            code: licenseCheck.error,
            message: getLicenseErrorMessage(licenseCheck.error || 'UNKNOWN'),
            contact: 'Please contact support@mpesaconnect.co.ke to activate your license'
        });
    }

    // Attach license data to request
    (req as any).license = licenseCheck.license;
    next();
};

/**
 * Get user-friendly error message
 */
const getLicenseErrorMessage = (errorCode: string): string => {
    const messages: Record<string, string> = {
        'NO_LICENSE_FOUND': 'No license found for this installation. Please contact support to activate.',
        'INVALID_LICENSE_FORMAT': 'License file is corrupted or invalid.',
        'SERVER_MISMATCH': 'This license is not valid for this server. Hardware change detected.',
        'DOMAIN_MISMATCH': 'This license is not valid for this domain.',
        'LICENSE_EXPIRED': 'Your license has expired. Please renew to continue using the application.',
        'LICENSE_SUSPENDED': 'Your license has been suspended. Please contact support.',
        'MASTER_SERVER_VALIDATION_FAILED': 'Unable to validate license with master server.',
        'LICENSE_CHECK_FAILED': 'License validation failed. Please try again or contact support.'
    };

    return messages[errorCode] || 'Unknown license error';
};

/**
 * Admin function to activate a new license
 */
export const activateLicense = async (req: Request, res: Response) => {
    try {
        const { domain, maxUsers, features, durationDays } = req.body;

        // Generate server fingerprint for the target domain
        const fingerprint = generateServerFingerprint();

        // Create license data
        const licenseData: LicenseData = {
            domain,
            serverFingerprint: fingerprint,
            activatedAt: new Date(),
            expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
            maxUsers: maxUsers || 100,
            features: features || ['all'],
            status: 'ACTIVE'
        };

        // Encrypt license data
        const encryptedLicense = encryptLicense(JSON.stringify(licenseData));

        // Save to database
        await prisma.systemLicense.upsert({
            where: { domain },
            create: {
                domain,
                licenseKey: encryptedLicense,
                fingerprint,
                status: 'ACTIVE',
                expiresAt: licenseData.expiresAt
            },
            update: {
                licenseKey: encryptedLicense,
                fingerprint,
                status: 'ACTIVE',
                expiresAt: licenseData.expiresAt
            }
        });

        res.json({
            success: true,
            message: 'License activated successfully',
            license: {
                domain,
                expiresAt: licenseData.expiresAt,
                maxUsers: licenseData.maxUsers
            }
        });
    } catch (error: any) {
        console.error('License activation error:', error);
        res.status(500).json({
            error: 'Failed to activate license',
            details: error.message
        });
    }
};

/**
 * Get license status
 */
export const getLicenseStatus = async (req: Request, res: Response) => {
    const licenseCheck = await checkLicense();

    if (!licenseCheck.valid) {
        return res.json({
            valid: false,
            error: licenseCheck.error,
            message: getLicenseErrorMessage(licenseCheck.error || 'UNKNOWN')
        });
    }

    res.json({
        valid: true,
        license: {
            domain: licenseCheck.license?.domain,
            expiresAt: licenseCheck.license?.expiresAt,
            maxUsers: licenseCheck.license?.maxUsers,
            features: licenseCheck.license?.features,
            status: licenseCheck.license?.status
        }
    });
};
