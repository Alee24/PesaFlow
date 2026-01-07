import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    console.log('='.repeat(80));
    console.log('USER DATABASE INSPECTION');
    console.log('='.repeat(80));

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            role: true,
            status: true,
            parentId: true,
            createdAt: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    console.log(`\nTotal Users: ${users.length}\n`);

    // Group by role
    const byRole = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    console.log('Users by Role:');
    Object.entries(byRole).forEach(([role, count]) => {
        console.log(`  ${role}: ${count}`);
    });

    console.log('\n' + '-'.repeat(80));
    console.log('DETAILED USER LIST');
    console.log('-'.repeat(80));

    users.forEach((user, index) => {
        console.log(`\n[${index + 1}] ${user.name || 'No Name'}`);
        console.log(`    ID:          ${user.id}`);
        console.log(`    Email:       ${user.email}`);
        console.log(`    Phone:       ${user.phoneNumber || 'N/A'}`);
        console.log(`    Role:        ${user.role}`);
        console.log(`    Status:      ${user.status}`);
        console.log(`    Parent ID:   ${user.parentId || 'None (Main Account)'}`);
        console.log(`    Created:     ${user.createdAt.toISOString()}`);

        if (user.parentId) {
            const parent = users.find(u => u.id === user.parentId);
            if (parent) {
                console.log(`    Parent:      ${parent.name} (${parent.email})`);
            }
        }
    });

    console.log('\n' + '='.repeat(80));
    console.log('HIERARCHY VIEW');
    console.log('='.repeat(80));

    const mainAccounts = users.filter(u => !u.parentId);

    mainAccounts.forEach(main => {
        console.log(`\n📊 ${main.name} (${main.email})`);
        console.log(`   Role: ${main.role} | Status: ${main.status}`);

        const subUsers = users.filter(u => u.parentId === main.id);
        if (subUsers.length > 0) {
            console.log(`   Team Members (${subUsers.length}):`);
            subUsers.forEach(sub => {
                console.log(`     └─ ${sub.name} (${sub.email})`);
                console.log(`        Role: ${sub.role} | Status: ${sub.status}`);
            });
        } else {
            console.log(`   No team members`);
        }
    });

    console.log('\n' + '='.repeat(80));

    await prisma.$disconnect();
}

checkUsers().catch(console.error);
