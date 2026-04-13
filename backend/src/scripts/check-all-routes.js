
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api'; // Backend
const FRONTEND_URL = 'http://localhost:2424'; // Frontend pages check

const EMAIL = 'mettoalex@gmail.com';
const PASSWORD = 'Digital2025';

async function checkPages() {
    console.log("🔍 Exhaustive Route Check...");

    // 1. Get Token
    let token;
    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, { email: EMAIL, password: PASSWORD });
        token = res.data.token;
        console.log("   ✅ Auth Token Acquired");
    } catch (e) {
        console.error("   ❌ CRITICAL: Login Failed", e.message);
        process.exit(1);
    }

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Check Backend API Endpoints (GET only)
    const apiEndpoints = [
        '/products',
        '/categories',
        '/transactions',
        '/withdrawals',
        '/invoices',
        '/wallet',
        '/profile',
        '/admin/users' // Admin only
    ];

    console.log("\n📡 Checking Backend APIs:");
    for (const endpoint of apiEndpoints) {
        try {
            await axios.get(`${BASE_URL}${endpoint}`, { headers });
            console.log(`   ✅ GET ${endpoint} - OK`);
        } catch (e) {
            console.error(`   ❌ GET ${endpoint} - FAILED (${e.message})`);
            if (e.response) console.error(`      Data:`, e.response.data);
        }
    }

    // 3. Simpler Frontend Check (just fetch the HTML status)
    // Note: Next.js pages might return 200 even on error, but 404/500 will show up.
    // Auth is client-side, so we just check if the route serves the app shell.
    const frontendRoutes = [
        '/dashboard',
        '/pos',
        '/products',
        '/transactions',
        '/withdrawals',
        '/wallet',
        '/settings',
        '/admin'
    ];

    console.log("\n🖥️  Checking Frontend Routes (Availability):");
    for (const route of frontendRoutes) {
        try {
            const res = await axios.get(`${FRONTEND_URL}${route}`);
            if (res.status === 200) {
                console.log(`   ✅ Route ${route} - Served`);
            }
        } catch (e) {
            console.error(`   ❌ Route ${route} - UNREACHABLE (${e.message})`);
        }
    }
}

checkPages();
