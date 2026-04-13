# 🔐 Mpesa Connect License Management Guide

This guide explains how to generate, manage, and troubleshoot Enterprise license keys for the Mpesa Connect system.

## 1. Generating License Keys (CLI)

You can generate license keys directly from the server terminal without using the web interface.

### **Command**
Run the following command from the `backend` directory:

```bash
cd /var/www/mpesaconnect.co.ke/backend
npx ts-node src/scripts/generate_license.ts [count] [plan_type]
```

### **Parameters**
- `[count]`: Number of keys to generate (Default: 1)
- `[plan_type]`: Plan name (Default: ENTERPRISE)

### **Examples**

**Generate 1 Enterprise Key:**
```bash
npx ts-node src/scripts/generate_license.ts
```

**Generate 5 Keys:**
```bash
npx ts-node src/scripts/generate_license.ts 5
```

**Generate Premium Keys:**
```bash
npx ts-node src/scripts/generate_license.ts 1 PREMIUM
```

---

## 2. Managing Licenses via Database

If you need to manually check, revoke, or debug licenses, you can use the database directly.

### **View All Keys**
```sql
SELECT * FROM user_license_keys;
```

### **Check Used Keys**
```sql
SELECT * FROM user_license_keys WHERE is_used = 1;
```

### **Revoke a Key (Reset it to unused)**
If a key was used on the wrong server or needs to be reset:
```sql
UPDATE user_license_keys 
SET is_used = 0, used_by = NULL, used_by_email = NULL, used_at = NULL, server_fingerprint = NULL 
WHERE license_key = 'ENT-XXXX-XXXX-XXXX-XXXX-XXXX';
```

---

## 3. License Verification Logic

The system validates licenses based on:
1.  **Existence**: Key must exist in `user_license_keys`.
2.  **Usage**: `is_used` must be false (for new activations).
3.  **Fingerprint**: If reusing a key, the server signature must match (preventing multi-server use).
4.  **Expiration**: Key must not be past `expires_at`.

### **Troubleshooting "Invalid License" Error**
1.  Ensure the key was generated using the script above or the Admin Dashboard.
2.  Check if `is_used` is already `1` in the database.
3.  Verify the key format is exactly `ENT-XXXX...` (no spaces).

---

## 4. Admin Dashboard Management

You can also manage licenses from the Web UI:
1.  Login as **Admin**.
2.  Navigate to **Administration > License**.
3.  Click "Generate New Key".
4.  View table of active/inactive keys.
