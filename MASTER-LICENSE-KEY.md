# 🔐 MASTER LICENSE KEY - CONFIDENTIAL

## ⚠️ CRITICAL SECURITY INFORMATION

This file contains your **MASTER LICENSE KEY** which can activate **UNLIMITED installations** of your software. Treat this like a password and **NEVER share it publicly**.

---

## 🔑 YOUR MASTER LICENSE KEY

```
MPESA-MASTER-v2-[CHECKSUM]-[ENCRYPTED_KEY]
```

**To generate your actual master key, run:**

```bash
cd backend
npx ts-node src/utils/master-license.ts
```

This will output your unique master license key.

---

## 📋 How to Use the Master Key

### Method 1: Environment Variable (Recommended)

Add to your `.env` file on any server:

```env
MASTER_LICENSE_KEY_INSTALLED=MPESA-MASTER-v2-xxxxxxxx-xxxxxxxxx
```

Then restart the application:
```bash
pm2 restart all
```

The application will automatically detect and validate the master key, bypassing all other license checks.

### Method 2: Manual Activation

1. Login as admin
2. Navigate to Admin → License
3. Paste the master key in the activation form
4. Click "Activate License"

---

## 🛡️ Security Features

### Ultra-Secure Encryption:
- **AES-256-GCM** encryption (military-grade)
- **HMAC-SHA512** signatures for tamper detection
- **Scrypt** key derivation (slow, resistant to brute-force)
- **Checksum validation** prevents tampering
- **Base64 encoding** for easy copy-paste

### Anti-Tampering:
- ✅ Any modification to the key makes it invalid
- ✅ Cannot be reverse-engineered without secret
- ✅ Signature verification prevents forgery
- ✅ Checksum detects corruption
- ✅ Encrypted payload hides license data

### Master Key Features:
- ✅ Works on **unlimited installations**
- ✅ Valid for **100 years** (36,500 days)
- ✅ No hardware binding
- ✅ No domain restrictions
- ✅ Full feature access
- ✅ Cannot be revoked remotely

---

## 🔒 Security Best Practices

### DO:
1. ✅ Store the master key in a password manager
2. ✅ Keep backups in secure locations
3. ✅ Change `MASTER_LICENSE_SECRET` in production
4. ✅ Use environment variables, not hardcoded values
5. ✅ Limit who has access to the master key
6. ✅ Monitor installations for unauthorized use

### DON'T:
1. ❌ Commit master key to Git
2. ❌ Share via email or chat
3. ❌ Store in plain text files
4. ❌ Use the same key across different products
5. ❌ Share with customers
6. ❌ Post publicly anywhere

---

## 🎯 Use Cases

### For You (Developer):
- ✅ Install on your own servers
- ✅ Development/testing environments
- ✅ Demo installations
- ✅ Internal company use
- ✅ Backup activation method

### For Customers:
- ❌ **NEVER** give customers the master key
- ✅ Use the request/approval workflow instead
- ✅ Generate individual licenses per customer
- ✅ Track installations via admin panel

---

## 🔧 Technical Details

### Key Structure:
```
MPESA-MASTER-v2-[CHECKSUM]-[BASE64_ENCRYPTED_DATA]
```

### Encrypted Data Contains:
```json
{
  "version": "v2",
  "type": "MASTER",
  "issuedTo": "KK Dynamic Enterprise Solutions LTD",
  "issuedAt": 1736613600000,
  "expiresAt": 4889213600000,
  "maxInstallations": 999999,
  "features": ["all", "unlimited", "master"],
  "signature": "[HMAC-SHA512-SIGNATURE]"
}
```

### Validation Process:
1. Check key format
2. Verify checksum
3. Decrypt with AES-256-GCM
4. Verify HMAC signature
5. Check expiration
6. Validate type = MASTER
7. Return full access

---

## 🚨 If Master Key is Compromised

If you suspect the master key has been leaked:

1. **Immediately** change `MASTER_LICENSE_SECRET` in `.env`
2. Generate a new master key
3. Update all your installations
4. Revoke compromised installations via admin panel
5. Monitor for unauthorized activations

---

## 📞 Support

For issues with the master key system:
- Email: info@kkdes.co.ke
- Phone: +254 724 454 757

---

## 📄 License

This master license system is proprietary to KK Dynamic Enterprise Solutions LTD.
Unauthorized use, distribution, or reverse engineering is strictly prohibited.

© 2026 KK Dynamic Enterprise Solutions LTD. All rights reserved.

---

**Last Updated:** January 11, 2026
**Version:** 2.0
**Status:** ACTIVE
