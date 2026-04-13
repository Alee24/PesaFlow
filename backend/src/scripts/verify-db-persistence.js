
const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function checkPersistence() {
    console.log("🔍 Checking Database Persistence...");

    // 1. Check Category
    const category = await prisma.category.findFirst({
        where: { name: 'UI Category' }
    });
    if (category) {
        console.log("   ✅ Found Category: 'UI Category' (ID: " + category.id + ")");
    } else {
        console.log("   ❌ FAILED: 'UI Category' not found in DB.");
    }

    // 2. Check Product
    const product = await prisma.product.findFirst({
        where: { name: 'UI Product' }
    });
    if (product) {
        console.log("   ✅ Found Product: 'UI Product' (Price: " + product.price + ", Stock: " + product.stockQuantity + ")");
        if (product.categoryId === category.id) {
            console.log("   ✅ Product correctly linked to Category.");
        } else {
            console.log("   ❌ Link Error: Product categoryId does not match.");
        }
    } else {
        console.log("   ❌ FAILED: 'UI Product' not found in DB.");
    }

    await prisma.$disconnect();
}

checkPersistence();
