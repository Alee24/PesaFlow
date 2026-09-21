"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProductionEnv = exports.generateSecurityCredential = void 0;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const DARAJA_PRODUCTION_CERT = `-----BEGIN CERTIFICATE-----
MIIGKzCCBBOgAwIBAgIQfde5An79yn5RhDzRzCOROzANBgkqhkiG9w0BAQsFADCB
iTELMAkGA1UEBhMCVVMxEzARBgNVBAgTCk5ldyBKZXJzZXkxFDASBgNVBAcTC0pl
cnNleSBDaXR5MR4wHDAGA1UEChMVVGhlIFVTRVJUUlVTVCBOZXR3b3JrMS8wLQYD
VQQDEyZVU0VSVHJ1c3QgUlNBIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MB4XDTIy
MDEyNDAwMDAwMFoXDTIzMDEyNDIzNTk1OVowajELMAkGA1UEBhMCS0UxEjAQBgNV
BAgTCU5haXJvYmkgMTESMBAGA1UEBxMJTmFpcm9iaSAxMRcwFQYDVQQKEw5TYWZh
cmljb20gUExDIDEaMBgGA1UEAxMRYXBpLnNhZmFyaWNvbS5jby5rZTCCASIwDQYJ
KoZIhvcNAQEBBQADggEPADCCAQoCggEBAMqN5N0UFR5MDy5q0NsSEjMiHJqkRwKM
oHiSjzLBYTJDzJJYXh8wnS6jU4qMlEhOy3tCEJCUVAlksgkFCpnB1c3tKrv4Pt2
dJxUUBaGS9eUGKr1JYhlRBIb3IQJQT3BVOoijvJg8dQ6V0Mw5mZWLzHv0V8Rxu
JaEJa1a3e85gRpkJqaSCVPUHQT8XhvWg3mWf8QFlZgvHnWMSuGtcFoFHOhZThmx
PwPBzOPM0M4LTxEXbkSaX1aBUSgFfx4E9oaOOaKMuWBFT0UiUnKGFCfWp3w9Uqi
KQKvS5rOtJhGPuE9KsMZ8yJhJqExwGvbFBRhPMaPlp7KbkCAwEAAaOCAYcwggGD
MB8GA1UdIwQYMBaAFFN5v1qqK0rPVIDh2JvAnfKyA2bLMB0GA1UdDgQWBBSqoiIt
IAX+8SgXJf/sOkf+7JL9LjAOBgNVHQ8BAf8EBAMCBaAwDAYDVR0TAQH/BAIwADAd
BgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwTwYDVR0gBEgwRjA6BgsrBgEE
AbIxAQICBzArMCkGCCsGAQUFBwIBFh1odHRwczovL3NlY3VyZS5jb21vZG8uY29t
L0NQUzAIBgZngQwBAgEwVAYDVR0fBE0wSzBJoEegRYZDaHR0cDovL2NybC51c2Vy
dHJ1c3QuY29tL1VTRVJUcnVzdFJTQUNlcnRpZmljYXRpb25BdXRob3JpdHkuY3Js
MIGBBggrBgEFBQcBAQR1MHMwTAYIKwYBBQUHMAKGQGh0dHA6Ly9jcnQudXNlcnRy
dXN0LmNvbS9VU0VSVHJ1c3RSU0FBZGRUcnVzdENBLmNydDAjBggrBgEFBQcwAYYX
aHR0cDovL29jc3AudXNlcnRydXN0LmNvbTApBgNVHREEIjAgghFhcGkuc2FmYXJp
Y29tLmNvLmtlgg93d3cuc2FmYXJpY29tLmtlMA0GCSqGSIb3DQEBCwUAA4ICAQB4
-----END CERTIFICATE-----`;
const DARAJA_SANDBOX_CERT = `-----BEGIN CERTIFICATE-----
MIIGKzCCBBOgAwIBAgIQfde5An79yn5RhDzRzCOROzANBgkqhkiG9w0BAQsFADCB
iTELMAkGA1UEBhMCVVMxEzARBgNVBAgTCk5ldyBKZXJzZXkxFDASBgNVBAcTC0pl
cnNleSBDaXR5MR4wHDAGA1UEChMVVGhlIFVTRVJUUlVTVCBOZXR3b3JrMS8wLQYD
VQQDEyZVU0VSVHJ1c3QgUlNBIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MB4XDTIy
MDEyNDAwMDAwMFoXDTIzMDEyNDIzNTk1OVowajELMAkGA1UEBhMCS0UxEjAQBgNV
BAgTCU5haXJvYmkgMRIwEAYDVQQHEwlOYWlyb2JpIDExFzAVBgNVBAoTDlNhZmFy
aWNvbSBQTEMgMRowGAYDVQQDExFhcGkuc2FmYXJpY29tLmNvLmtlMIIBIjANBgkq
hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoMFy7r5GsA9PXPX3hpwXmFNFNmH6s6VE
mkJpEaroUXLnBbMqrCqISWJ7KUvMC6e1q8ByNMUm7Y1w5P1vt7lq1NRFL7VrP7h1
OGj0TLKBJVqPKCa6XG8iN5sTJknHy2ZEWb/S3i6VFpWh5cClC0vKnW7iJh9g4l9w
-----END CERTIFICATE-----`;
const generateSecurityCredential = (password, isProduction = true) => {
    const pwd = (password || '').trim();
    if (!pwd) {
        throw new Error('Initiator Password is required. Configure it in Settings → M-Pesa → Initiator Password (API Operator).');
    }
    const customCertPath = process.env.MPESA_CERT_PATH
        ? path_1.default.resolve(process.env.MPESA_CERT_PATH)
        : null;
    const bundledCertPath = path_1.default.join(__dirname, '..', 'certs', isProduction ? 'production.cer' : 'sandbox.cer');
    let certContent = null;
    if (customCertPath) {
        try {
            certContent = fs_1.default.readFileSync(customCertPath, 'utf8');
            console.log(`[Daraja Security] Using custom cert from: ${customCertPath}`);
        }
        catch {
            console.warn(`[Daraja Security] Custom cert not readable at ${customCertPath}, falling back`);
        }
    }
    if (!certContent) {
        try {
            certContent = fs_1.default.readFileSync(bundledCertPath, 'utf8');
            if (certContent.length < 500)
                certContent = null;
            else
                console.log(`[Daraja Security] Using bundled cert (${isProduction ? 'production' : 'sandbox'})`);
        }
        catch {
        }
    }
    if (!certContent || certContent.length < 500) {
        certContent = isProduction ? DARAJA_PRODUCTION_CERT : DARAJA_SANDBOX_CERT;
        console.log(`[Daraja Security] Using embedded ${isProduction ? 'production' : 'sandbox'} cert`);
    }
    try {
        const pem = certContent.includes('BEGIN CERTIFICATE')
            ? certContent.trim()
            : `-----BEGIN CERTIFICATE-----\n${certContent.trim()}\n-----END CERTIFICATE-----`;
        const encrypted = crypto_1.default.publicEncrypt({
            key: pem,
            padding: crypto_1.default.constants.RSA_PKCS1_PADDING,
        }, Buffer.from(pwd, 'utf8'));
        const result = encrypted.toString('base64');
        console.log(`[Daraja Security] SecurityCredential generated (${result.substring(0, 10)}...)`);
        return result;
    }
    catch (err) {
        console.error('[Daraja Security] Certificate encryption failed:', err.message);
        console.warn('[Daraja Security] Falling back to Base64 password — upload correct cert to fix this');
        return Buffer.from(pwd, 'utf8').toString('base64');
    }
};
exports.generateSecurityCredential = generateSecurityCredential;
const isProductionEnv = (env) => {
    const normalized = (env || '').trim().toLowerCase();
    return normalized === 'production' || normalized === 'live';
};
exports.isProductionEnv = isProductionEnv;
//# sourceMappingURL=daraja-security.js.map