import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Migration Script: Convert Sub-Merchants to Team Members
 * 
 * This script:
 * 1. Finds all users with parentId (sub-merchants)
 * 2. Creates TeamMember records for them
 * 3. Updates transactions to link to team members
 * 4. Deletes the old user accounts
 */

async function migrateToTeamMembers() {
    console.log('='.repeat(80));
    console.log('MIGRATION: Sub-Merchants → Team Members');
    console.log('='.repeat(80));

    try {
        // Step 1: Find all sub-merchants
        const subMerchants = await prisma.user.findMany({
            where: {
                parentId: { not: null }
            },
            include: {
                initiatedTx: true
            }
        });

        console.log(`\nFound ${subMerchants.length} sub-merchants to migrate\n`);

        if (subMerchants.length === 0) {
            console.log('✅ No sub-merchants to migrate. Exiting.');
            return;
        }

        let migratedCount = 0;
        let errorCount = 0;

        for (const subMerchant of subMerchants) {
            console.log(`\nMigrating: ${subMerchant.name} (${subMerchant.email})`);
            console.log(`  Parent ID: ${subMerchant.parentId}`);
            console.log(`  Transactions: ${subMerchant.initiatedTx.length}`);

            try {
                await prisma.$transaction(async (tx) => {
                    // Step 2: Create TeamMember record
                    const teamMember = await tx.teamMember.create({
                        data: {
                            merchantId: subMerchant.parentId!,
                            name: subMerchant.name || 'Team Member',
                            email: subMerchant.email,
                            phoneNumber: subMerchant.phoneNumber,
                            role: 'STAFF',
                            status: subMerchant.status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED',
                            permissions: JSON.stringify({
                                canMakeSales: true,
                                canViewReports: false,
                                canManageInventory: false
                            })
                        }
                    });

                    console.log(`  ✓ Created TeamMember: ${teamMember.id}`);

                    // Step 3: Update transactions
                    if (subMerchant.initiatedTx.length > 0) {
                        const updateResult = await tx.transaction.updateMany({
                            where: {
                                initiatorUserId: subMerchant.id
                            },
                            data: {
                                initiatorUserId: subMerchant.parentId,
                                initiatorTeamMemberId: teamMember.id
                            }
                        });

                        console.log(`  ✓ Updated ${updateResult.count} transactions`);
                    }

                    // Step 4: Delete old user account
                    await tx.user.delete({
                        where: { id: subMerchant.id }
                    });

                    console.log(`  ✓ Deleted old user account`);
                });

                migratedCount++;
                console.log(`  ✅ Migration successful`);

            } catch (error) {
                errorCount++;
                console.error(`  ❌ Migration failed:`, error);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('MIGRATION SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total sub-merchants: ${subMerchants.length}`);
        console.log(`Successfully migrated: ${migratedCount}`);
        console.log(`Failed: ${errorCount}`);
        console.log('='.repeat(80));

        if (migratedCount > 0) {
            console.log('\n✅ Migration completed successfully!');
            console.log('\nNext steps:');
            console.log('1. Run: npx prisma generate');
            console.log('2. Restart your backend server');
            console.log('3. Test team member functionality');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
migrateToTeamMembers()
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
