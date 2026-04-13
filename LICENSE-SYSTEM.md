# 🔐 Mpesa Connect - Licensing System Documentation

## Overview

This application includes a **multi-layered licensing system** that prevents unauthorized use. The system uses:

1. **Hardware Fingerprinting** - Binds license to specific server hardware
2. **Domain Validation** - License only works on authorized domain
3. **Encryption** - All license data is encrypted with AES-256
4. **Master Server Validation** - Optional remote validation
5. **Expiration Control** - Time-based license expiration

## 🛡️ Security Features

### Layer 1: Hardware Fingerprinting
- Generates unique fingerprint from:
  - Server hostname
  - CPU model
  - Network MAC addresses
  - Operating system details
- License becomes invalid if hardware changes

### Layer 2: Domain Binding
- License is tied to specific domain (e.g., `mpesaconnect.co.ke`)
- Cannot be used on different domains

### Layer 3: Encryption
- All license data encrypted with AES-256-CBC
- Encryption key stored in environment variables
- Cannot be reverse-engineered without the key

### Layer 4: Database Protection
- License stored in encrypted format in database
- Even with database access, license cannot be copied

### Layer 5: Master Server Validation (Optional)
- Can validate with central licensing server
- Prevents license sharing/cloning
- Real-time license status checking

## 📋 How It Works

### Installation Flow:

1. **User installs application** on their server
2. **Application starts** but all API routes are blocked
3. **Only auth and license endpoints** work
4. **User contacts you** for activation
5. **You generate license** from admin portal
6. **License is activated** in their database
7. **Application becomes fully functional**

### License Validation:

Every API request (except auth/license) checks:
- ✅ License exists in database
- ✅ License is not expired
- ✅ Server fingerprint matches
- ✅ Domain matches
- ✅ License status is ACTIVE
- ✅ (Optional) Master server validates

If ANY check fails → **403 Forbidden**

## 🚀 Activation Process

### For You (Admin):

1. **Customer requests activation**
2. **Login to admin portal** → Navigate to License Management
3. **Customer provides**:
   - Domain name
   - Server fingerprint (from their installation)
4. **You activate license** with:
   - Domain
   - Max users
   - Features enabled
   - Duration (days)
5. **License is generated** and saved to their database
6. **Application unlocks** immediately

### For Customer:

1. **Install application** on server
2. **Run migrations**: `npx prisma migrate deploy`
3. **Start application**: `pm2 start`
4. **Visit application** - will show "License Required" error
5. **Get server fingerprint**:
   ```bash
   curl https://their-domain.com/api/license/fingerprint
   ```
6. **Send you**:
   - Domain name
   - Server fingerprint
7. **Wait for activation**
8. **Refresh page** - application works!

## 🔧 Environment Variables

Add to `.env`:

```env
# License Configuration
LICENSE_ENCRYPTION_KEY=your-32-character-secret-key-here-change-this
MASTER_LICENSE_SERVER=https://license.mpesaconnect.co.ke
MASTER_LICENSE_KEY=your-master-server-api-key
DOMAIN=mpesaconnect.co.ke
```

## 📡 API Endpoints

### Get License Status
```bash
GET /api/license/status
Authorization: Bearer <admin-token>
```

Response:
```json
{
  "valid": true,
  "license": {
    "domain": "example.com",
    "expiresAt": "2027-01-11T00:00:00.000Z",
    "maxUsers": 100,
    "features": ["all"],
    "status": "ACTIVE"
  }
}
```

### Get Server Fingerprint
```bash
GET /api/license/fingerprint
Authorization: Bearer <admin-token>
```

Response:
```json
{
  "fingerprint": "abc123...",
  "domain": "example.com",
  "hostname": "server-01"
}
```

### Activate License (Admin Only)
```bash
POST /api/license/activate
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "domain": "example.com",
  "maxUsers": 100,
  "features": ["all"],
  "durationDays": 365
}
```

## 🔒 What Happens Without License?

- ✅ **Can access**: Login, Registration, License endpoints
- ❌ **Cannot access**: Dashboard, POS, Products, Sales, Transactions, etc.
- ❌ **Error shown**: "License validation failed - Please contact support"

## 🛠️ Troubleshooting

### "Server Mismatch" Error
**Cause**: Hardware changed (new server, VM migration)
**Solution**: Generate new license for new fingerprint

### "Domain Mismatch" Error
**Cause**: Domain changed or incorrect
**Solution**: Update license with correct domain

### "License Expired" Error
**Cause**: License period ended
**Solution**: Extend license duration

### "Master Server Validation Failed"
**Cause**: Cannot reach master server
**Solution**: Check network, or disable master validation

## 🎯 Best Practices

1. **Change encryption key** in production
2. **Keep encryption key secret** - never commit to Git
3. **Set up master server** for additional security
4. **Monitor license expirations** proactively
5. **Keep activation logs** for audit trail
6. **Backup license database** regularly

## 🚨 Anti-Tampering Measures

### Code Obfuscation
- Minified and bundled code
- No source maps in production
- Environment variables required

### Database Protection
- Encrypted license data
- Cannot be manually edited
- Validation on every request

### Hardware Binding
- License tied to specific hardware
- Cannot be copied to another server
- Detects VM cloning

### Time-Based Expiration
- Automatic expiration
- Cannot be bypassed
- Server time validation

## 📞 Support

For license activation or issues:
- **Email**: support@mpesaconnect.co.ke
- **Phone**: +254 700 448 448
- **Portal**: https://mpesaconnect.co.ke/admin/license

---

**⚠️ IMPORTANT**: This licensing system is designed to protect your intellectual property. Do not share the encryption key or master server credentials.
