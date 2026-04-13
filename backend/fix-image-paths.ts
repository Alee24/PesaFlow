import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('repairing Image Paths in Database... 🛠️\n');

    // 1. FIX PRODUCTS
    const products = await prisma.product.findMany({
        where: {
            OR: [
                { imageUrl: { contains: 'localhost' } },
                { imageUrl: { contains: '127.0.0.1' } },
                { imageUrl: { contains: ':\\' } } // Windows paths
            ]
        }
    });

    console.log(`Found ${products.length} products with bad image paths.`);

    for (const p of products) {
        if (!p.imageUrl) continue;
        const newPath = fixPath(p.imageUrl);
        if (newPath !== p.imageUrl) {
            await prisma.product.update({
                where: { id: p.id },
                data: { imageUrl: newPath }
            });
            console.log(`✅ Fixed Product [${p.name}]: ${p.imageUrl} -> ${newPath}`);
        }
    }

    // 2. FIX BUSINESS PROFILES (Logo & KYC)
    const profiles = await prisma.businessProfile.findMany({
        where: {
            OR: [
                { logoUrl: { contains: 'localhost' } },
                { idFrontUrl: { contains: 'localhost' } },
                { businessPermitUrl: { contains: 'localhost' } }
                // Add others if needed broad match
            ]
        }
    });

    console.log(`\nFound ${profiles.length} profiles with bad paths.`);

    for (const p of profiles) {
        const updates: any = {};
        let updated = false;

        ['logoUrl', 'idFrontUrl', 'idBackUrl', 'businessPermitUrl', 'registrationCertUrl', 'kraCertUrl'].forEach((field) => {
            const val = (p as any)[field];
            if (val && (val.includes('localhost') || val.includes('127.0.0.1') || val.includes(':\\'))) {
                updates[field] = fixPath(val);
                updated = true;
                console.log(`   > Fixing ${field}: ${val} -> ${updates[field]}`);
            }
        });

        if (updated) {
            await prisma.businessProfile.update({
                where: { id: p.id },
                data: updates
            });
            console.log(`✅ Fixed Profile for: ${p.companyName}`);
        }
    }

    console.log('\n✨ Repair Complete. All paths should now be relative (/uploads/...).');
}

function fixPath(original: string): string {
    // 1. Extract filename from standard structure
    if (original.includes('/uploads/')) {
        const parts = original.split('/uploads/');
        return `/uploads/${parts[1]}`;
    }

    // 2. Handle Windows Absolute Paths (C:\...\uploads\file.png)
    if (original.includes('\\uploads\\')) {
        const parts = original.split('\\uploads\\');
        return `/uploads/${parts[1].replace(/\\/g, '/')}`; // Ensure forward slashes
    }

    // 3. Fallback: If it's a URL ending in filename
    try {
        const url = new URL(original);
        const pathname = url.pathname;
        if (pathname.includes('/uploads')) return pathname;
        return pathname; // Hope for the best
    } catch (e) {
        // Not a URL, maybe just "filename.png"
        if (!original.startsWith('/')) return `/uploads/${original}`;
        return original;
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
