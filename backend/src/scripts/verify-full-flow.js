
const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const EMAIL = 'mettoalex@gmail.com';
const PASSWORD = 'Digital2025';

async function testFlow() {
    console.log("🚀 Starting System Verification...");

    try {
        // 1. Login
        console.log(`\n1️⃣  Testing Login (${EMAIL})...`);
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });

        if (loginRes.status === 200 && loginRes.data.token) {
            console.log("   ✅ Login Successful!");
            console.log(`   👤 User: ${loginRes.data.user.name} (${loginRes.data.user.role})`);
        } else {
            console.error("   ❌ Login Failed (No Token)", loginRes.data);
            return;
        }

        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Create Category
        const catName = `Test Cat ${Date.now()}`;
        console.log(`\n2️⃣  Creating Category: '${catName}'...`);
        const catRes = await axios.post(`${API_URL}/categories`, { name: catName }, { headers });
        console.log("   ✅ Category Created:", catRes.data.id);
        const catId = catRes.data.id;

        // 3. Create Product
        const prodName = `Test Product ${Date.now()}`;
        console.log(`\n3️⃣  Creating Product: '${prodName}' inside category...`);
        const prodRes = await axios.post(`${API_URL}/products`, {
            name: prodName,
            price: 150,
            stockQuantity: 50,
            categoryId: catId
        }, { headers });
        console.log("   ✅ Product Created:", prodRes.data.id);

        // 4. Verify POS Data
        console.log(`\n4️⃣  Verifying Data on POS Endpoint...`);
        const productsRes = await axios.get(`${API_URL}/products`, { headers });
        const categoriesRes = await axios.get(`${API_URL}/categories`, { headers });

        const foundProd = productsRes.data.find(p => p.id === prodRes.data.id);
        const foundCat = categoriesRes.data.find(c => c.id === catId);

        if (foundProd && foundCat) {
            console.log(`   ✅ Verification Success! Found '${foundProd.name}' in category '${foundCat.name}'.`);
            console.log("\n🎉 SYSTEM IS FULLY FUNCTIONAL");
        } else {
            console.error("   ❌ Verification Failed: Could not find created items in fetch list.");
        }

    } catch (error) {
        console.error("\n❌ TEST FAILED:", error.message);
        if (error.response) {
            console.error("   Status:", error.response.status);
            console.error("   Data:", error.response.data);
        }
    }
}

testFlow();
