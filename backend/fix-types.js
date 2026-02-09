// Script to fix TypeScript type errors in controller files
// This script adds type assertions to convert string | string[] to string

const fs = require('fs');
const path = require('path');

const controllersDir = 'c:\\Users\\Metto\\Desktop\\Anti gravity\\backend\\src\\controllers';

const fixes = [
    // invoice.controller.ts
    {
        file: 'invoice.controller.ts',
        replacements: [
            {
                from: /const { id } = req\.params;/g,
                to: 'const id = req.params.id as string;'
            }
        ]
    },
    // license-request.controller.ts
    {
        file: 'license-request.controller.ts',
        replacements: [
            {
                from: /const { requestId } = req\.params;/g,
                to: 'const requestId = req.params.requestId as string;'
            }
        ]
    },
    // product.controller.ts
    {
        file: 'product.controller.ts',
        replacements: [
            {
                from: /const { id } = req\.params;/g,
                to: 'const id = req.params.id as string;'
            },
            {
                from: /deleteProductImage\(id,/g,
                to: 'deleteProductImage(id as string,'
            }
        ]
    },
    // sales.controller.ts
    {
        file: 'sales.controller.ts',
        replacements: [
            {
                from: /const { id } = req\.params;/g,
                to: 'const id = req.params.id as string;'
            }
        ]
    },
    // support.controller.ts
    {
        file: 'support.controller.ts',
        replacements: [
            {
                from: /const { id } = req\.params;/g,
                to: 'const id = req.params.id as string;'
            }
        ]
    },
    // team.controller.ts
    {
        file: 'team.controller.ts',
        replacements: [
            {
                from: /const { id } = req\.params;/g,
                to: 'const id = req.params.id as string;'
            }
        ]
    },
    // transaction.controller.ts
    {
        file: 'transaction.controller.ts',
        replacements: [
            {
                from: /const { id } = req\.params;/g,
                to: 'const id = req.params.id as string;'
            }
        ]
    },
    // user-license.controller.ts
    {
        file: 'user-license.controller.ts',
        replacements: [
            {
                from: /const { keyId } = req\.params;/g,
                to: 'const keyId = req.params.keyId as string;'
            }
        ]
    },
    // withdrawal.controller.ts
    {
        file: 'withdrawal.controller.ts',
        replacements: [
            {
                from: /const { id } = req\.params;/g,
                to: 'const id = req.params.id as string;'
            }
        ]
    }
];

fixes.forEach(({ file, replacements }) => {
    const filePath = path.join(controllersDir, file);

    try {
        let content = fs.readFileSync(filePath, 'utf8');

        replacements.forEach(({ from, to }) => {
            content = content.replace(from, to);
        });

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Fixed ${file}`);
    } catch (error) {
        console.error(`✗ Error fixing ${file}:`, error.message);
    }
});

console.log('\nAll fixes applied!');
