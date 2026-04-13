
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
    await p.$connect();
    console.log('Dropping problematic tables if they exist in metadata but not in engine...');
    await p.$executeRawUnsafe('DROP TABLE IF EXISTS subscriptions, business_profiles, users, wallets, products, categories, stock_movements, transactions, sales, sale_items, withdrawals, notification, team_members, customers, customer_notes, customer_interactions, customer_documents, customer_tags, customer_tag_relations, customer_segments, customer_segment_relations, email_campaigns, email_campaign_recipients, tickets, ticket_messages, system_settings, system_licenses, license_requests, user_license_keys');
    console.log('Tables dropped.');
}
run().finally(() => p.$disconnect());
