
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const res = await prisma.$queryRaw`SELECT migration_name FROM _prisma_migrations`;
        console.log('Applied migrations:');
        res.forEach(row => console.log(`- ${row.migration_name}`));
    } catch (err) {
        console.error('Error querying migrations:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
