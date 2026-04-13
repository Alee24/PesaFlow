
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'tester@example.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            phoneNumber: '254712345678',
            passwordHash: hashedPassword,
            role: 'MERCHANT',
            status: 'ACTIVE'
        },
    });

    console.log(`Test user created/found:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
