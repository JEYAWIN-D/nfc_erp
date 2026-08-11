import prisma from './src/config/prisma';
async function run() {
  await prisma.$executeRawUnsafe(`UPDATE bundles SET status = 'COMPLETED' WHERE status = 'QC_PENDING'`);
  console.log("Done");
}
run().finally(() => prisma.$disconnect());
