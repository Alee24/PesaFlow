
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001/api';

async function verifyAllDataFields() {
    console.log("🚀 STARTING COMPREHENSIVE DATA VERIFICATION 🚀");

    // 1. Authenticate
    let token;
    let userId;
    try {
        const login = await axios.post(`${API_URL}/auth/login`, {
            email: 'mettoalex@gmail.com',
            password: 'Digital2025'
        });
        token = login.data.token;
        userId = login.data.user.id;
        console.log("✅ Authenticated as Admin");
    } catch (e) {
        console.error("❌ Login Failed", e.message);
        return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // ==========================================
    // 2. SETTINGS / PROFILE VERIFICATION
    // ==========================================
    console.log("\n--- [1/3] Testing SETTINGS (Profile) ---");
    const testCompanyName = `Metto Global ${Date.now()}`;
    const testLocation = "Nairobi, Kenya";

    try {
        // Update via API
        await axios.put(`${API_URL}/profile`, {
            companyName: testCompanyName,
            location: testLocation,
            contactPhone: "0712345678"
        }, { headers });
        console.log("   📤 Profile Update Sent via API");

        // Verify in DB
        const dbProfile = await prisma.businessProfile.findFirst({
            where: { userId: userId }
        });

        if (dbProfile && dbProfile.companyName === testCompanyName && dbProfile.location === testLocation) {
            console.log("   ✅ DB VERIFIED: Profile updated correctly.");
            console.log(`      Name: ${dbProfile.companyName}, Location: ${dbProfile.location}`);
        } else {
            console.error("   ❌ DB FAILURE: Profile data mismatch.");
            console.log("      Expected:", testCompanyName);
            console.log("      Found:", dbProfile?.companyName);
        }

    } catch (e) {
        console.error("   ❌ Profile Update Failed", e.message);
    }

    // ==========================================
    // 3. INVOICES & TRANSACTIONS VERIFICATION
    // ==========================================
    console.log("\n--- [2/3] Testing INVOICES & TRANSACTIONS ---");
    const invoiceNum = `INV-${Date.now()}`;
    const clientName = "Test Client Co.";

    try {
        // Create Invoice via API
        const invPayload = {
            invoiceNumber: invoiceNum,
            clientName: clientName,
            clientEmail: "client@test.com",
            date: new Date().toISOString(),
            items: [
                { productId: null, price: 1000, quantity: 2 }, // Ad-hoc item
                { productId: null, price: 500, quantity: 1 }
            ],
            notes: "Test Invoice Data Persistence"
        };

        const invRes = await axios.post(`${API_URL}/invoices`, invPayload, { headers });
        const txId = invRes.data.transaction.id;
        console.log("   📤 Invoice Created via API. Transaction ID:", txId);

        // Verify Transaction in DB
        const dbTx = await prisma.transaction.findUnique({
            where: { id: txId }
        });

        let txOk = false;
        if (dbTx && dbTx.type === 'INVOICE' && Number(dbTx.amount) === 2500) {
            console.log("   ✅ DB VERIFIED: Transaction Record.");
            console.log(`      Type: ${dbTx.type}, Amount: ${dbTx.amount}, Ref: ${dbTx.reference}`);

            // Check Metadata
            const meta = JSON.parse(dbTx.metadata);
            if (meta.clientName === clientName && meta.notes === "Test Invoice Data Persistence") {
                console.log("      Metadata (Client/Notes) saved correctly.");
                txOk = true;
            } else {
                console.error("      ❌ Metadata mismatch.");
            }
        } else {
            console.error("   ❌ DB FAILURE: Transaction incorrect or missing.");
        }

        // Verify Sale & Sale Items
        if (txOk) {
            const dbSale = await prisma.sale.findFirst({
                where: { transactionId: txId },
                include: { items: true }
            });

            if (dbSale && dbSale.items.length === 2) {
                console.log("   ✅ DB VERIFIED: Sale & Sale Items.");
                console.log(`      Sale Total: ${dbSale.totalAmount}`);
                console.log(`      Items Count: ${dbSale.items.length}`);
            } else {
                console.error("   ❌ DB FAILURE: Sale records missing.");
            }
        }

    } catch (e) {
        console.error("   ❌ Invoice Test Failed", e.message);
        if (e.response) console.error(e.response.data);
    }

    // ==========================================
    // 4. WALLET & WITHDRAWALS
    // ==========================================
    console.log("\n--- [3/3] Testing WALLET Connection ---");
    const wallet = await prisma.wallet.findFirst({ where: { userId } });
    if (wallet) {
        console.log("   ✅ Wallet Exists. Balance:", wallet.balance);
    } else {
        console.error("   ❌ Wallet Missing!");
    }

    console.log("\n🏁 VERIFICATION COMPLETE 🏁");
    await prisma.$disconnect();
}

verifyAllDataFields();

export { };
