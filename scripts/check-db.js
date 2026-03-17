const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const result = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
        console.log('Tables:', result.map(t => t.tablename));

        const types = await prisma.$queryRaw`SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')`;
        console.log('Types:', types.map(t => t.typname));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
