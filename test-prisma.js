import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const result = await prisma.user.findMany();
        console.log(result);
    } catch (error) {
        console.error("Error testing Prisma Client:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();