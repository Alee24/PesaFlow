# PesaFlow Diagnostic Tools

This directory contains diagnostic and troubleshooting scripts to help identify and fix connection issues in the PesaFlow application.

## 🛠️ Available Tools

### 1. **diagnose_connection.ps1** - Full System Diagnostic
**Purpose:** Comprehensive health check of the entire PesaFlow system

**What it checks:**
- ✅ Port configuration (.env files)
- ✅ Running processes and listening ports
- ✅ Database connectivity
- ✅ Application logs (PM2)
- ✅ Build status (backend & frontend)
- ✅ Prisma database status
- ✅ API endpoint availability

**Usage:**
```powershell
.\diagnose_connection.ps1
```

**Output:**
- Console output with color-coded status
- Detailed report saved to `diagnostic_report_<timestamp>.txt`
- Automatically opens report in Notepad

**When to use:**
- When you can't load data in the dashboard
- After making configuration changes
- Before deploying to production
- Weekly health checks

---

### 2. **quick_fix.ps1** - Quick Configuration Fix
**Purpose:** Quickly check and fix common .env configuration issues

**What it does:**
- ✅ Checks if .env file exists
- ✅ Verifies PORT is set to 5454
- ✅ Automatically fixes PORT if incorrect
- ✅ Validates DATABASE_URL exists

**Usage:**
```powershell
.\quick_fix.ps1
```

**When to use:**
- Before running the full diagnostic
- After cloning the repository
- When services won't start
- Quick configuration validation

---

### 3. **analyze_logs.ps1** - Intelligent Log Analyzer
**Purpose:** Analyze PM2 logs and identify error patterns

**What it analyzes:**
- 🔍 Database connection errors
- 🔍 Port conflict issues
- 🔍 Missing module errors
- 🔍 Authentication failures
- 🔍 M-Pesa API errors
- 🔍 Build/compilation errors
- 🔍 License validation issues

**Usage:**
```powershell
# Analyze all services (last 100 lines)
.\analyze_logs.ps1

# Analyze specific service
.\analyze_logs.ps1 -Service "pesaflow-api"

# Analyze more lines
.\analyze_logs.ps1 -Lines 500
```

**Output:**
- Pattern-matched error categorization
- Recent log excerpts
- Service restart count
- Targeted recommendations
- Full report saved to `log_analysis_<timestamp>.txt`

**When to use:**
- When services are crashing
- To identify recurring errors
- Before contacting support
- After deployment issues

---

## 🚨 Common Issues & Solutions

### Issue 1: "Can't load data in dashboard"

**Symptoms:**
- Dashboard shows loading spinner
- No data appears
- Console shows connection errors

**Diagnosis:**
```powershell
.\diagnose_connection.ps1
```

**Common Causes:**
1. **Backend API not running**
   - Fix: `pm2 restart pesaflow-api`
   
2. **Wrong PORT in .env**
   - Fix: `.\quick_fix.ps1`
   
3. **Database connection failed**
   - Fix: Check MySQL is running, verify DATABASE_URL

---

### Issue 2: "Port already in use"

**Symptoms:**
- Error: `EADDRINUSE`
- Service won't start

**Diagnosis:**
```powershell
netstat -ano | findstr :5454
```

**Solution:**
```powershell
# Find the PID using the port
netstat -ano | findstr :5454

# Kill the process (replace <PID> with actual PID)
taskkill /PID <PID> /F

# Restart service
pm2 restart pesaflow-api
```

---

### Issue 3: "Database connection refused"

**Symptoms:**
- Error: `ECONNREFUSED 3306`
- Prisma errors

**Diagnosis:**
```powershell
# Check if MySQL is running
Get-Service MySQL

# Test database connection
cd backend
npx prisma db push
```

**Solution:**
```powershell
# Start MySQL
Start-Service MySQL

# Verify connection in .env
# DATABASE_URL="mysql://root:@localhost:3306/pesaflow"

# Test connection
cd backend
npx prisma db push
```

---

### Issue 4: "Module not found"

**Symptoms:**
- Error: `Cannot find module`
- Error: `MODULE_NOT_FOUND`

**Diagnosis:**
```powershell
.\analyze_logs.ps1 -Service "pesaflow-api"
```

**Solution:**
```powershell
cd backend
npm install
npx prisma generate
npm run build
pm2 restart pesaflow-api
```

---

## 📊 Diagnostic Workflow

### Quick Check (2 minutes)
```powershell
# 1. Fix configuration
.\quick_fix.ps1

# 2. Check PM2 status
pm2 status

# 3. Test API
curl http://localhost:5454/api/health
```

### Full Diagnostic (5 minutes)
```powershell
# 1. Run full diagnostic
.\diagnose_connection.ps1

# 2. Review report
# Opens automatically in Notepad

# 3. Apply recommended fixes
```

### Deep Troubleshooting (10 minutes)
```powershell
# 1. Analyze logs
.\analyze_logs.ps1 -Lines 500

# 2. Check database
cd backend
npx prisma migrate status
npx prisma db push

# 3. Rebuild if needed
npm run build

# 4. Restart services
pm2 restart all
pm2 save
```

---

## 🔧 Configuration Files

### Backend .env (Required Settings)
```env
# Database
DATABASE_URL="mysql://root:@localhost:3306/pesaflow"

# Server
PORT=5454
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key

# M-Pesa (Optional)
MPESA_CONSUMER_KEY=your-key
MPESA_CONSUMER_SECRET=your-secret
MPESA_PASSKEY=your-passkey
MPESA_SHORTCODE=174379
MPESA_ENV=sandbox

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend .env.local (Optional)
```env
NEXT_PUBLIC_API_URL=http://localhost:5454
```

---

## 📝 Port Reference

| Service | Port | Status Check |
|---------|------|--------------|
| PesaFlow API | 5454 | `curl http://localhost:5454/api/health` |
| PesaFlow Web | 5054 | `curl http://localhost:5054` |
| M-Clinic API | 3434 | `curl http://localhost:3434/api/health` |
| M-Clinic Web | 3034 | `curl http://localhost:3034` |
| MySQL | 3306 | `Test-NetConnection localhost -Port 3306` |

---

## 🚀 Quick Start After Fresh Install

```powershell
# 1. Create and configure .env
.\quick_fix.ps1
# Edit backend/.env with your settings

# 2. Install dependencies
cd backend
npm install
npx prisma generate
npx prisma db push
npm run build

cd ../frontend
npm install
npm run build

# 3. Start services
cd ..
pm2 start backend/dist/server.js --name pesaflow-api
pm2 start npm --name pesaflow-web -- start -- -p 5054
pm2 save

# 4. Verify
.\diagnose_connection.ps1
```

---

## 📞 Support Checklist

Before contacting support, run these commands and save the output:

```powershell
# 1. Full diagnostic
.\diagnose_connection.ps1

# 2. Log analysis
.\analyze_logs.ps1 -Lines 200

# 3. PM2 status
pm2 status
pm2 logs --lines 100 --nostream

# 4. Database status
cd backend
npx prisma migrate status

# 5. System info
node --version
npm --version
Get-Service MySQL
```

Attach the generated reports:
- `diagnostic_report_<timestamp>.txt`
- `log_analysis_<timestamp>.txt`

---

## 🎯 Best Practices

1. **Run diagnostics before making changes**
   ```powershell
   .\diagnose_connection.ps1
   ```

2. **Always check logs after errors**
   ```powershell
   .\analyze_logs.ps1
   ```

3. **Keep builds up to date**
   - Rebuild if code changes
   - Rebuild if dependencies change
   - Rebuild weekly in development

4. **Monitor PM2 processes**
   ```powershell
   pm2 monit
   ```

5. **Save PM2 configuration**
   ```powershell
   pm2 save
   ```

---

## 📚 Additional Resources

- **PM2 Documentation:** https://pm2.keymetrics.io/docs/usage/quick-start/
- **Prisma Documentation:** https://www.prisma.io/docs
- **MySQL Documentation:** https://dev.mysql.com/doc/

---

**Last Updated:** 2026-01-17
**Version:** 1.0
**Maintainer:** PesaFlow Development Team
