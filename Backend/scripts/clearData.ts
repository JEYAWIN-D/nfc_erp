import prisma from '../src/config/prisma'

async function main() {
  console.log('Clearing transaction data...')
  
  await prisma.attendance.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.qCCheckLog.deleteMany()
  await prisma.bundleStageLog.deleteMany()
  
  // reset bundle tag assignments
  await prisma.bundleTagAssignment.updateMany({
    data: {
      status: 'AVAILABLE',
      bundleId: null,
      assignedAt: null,
      releasedAt: null,
      assignedBy: null
    }
  })

  await prisma.productionTask.deleteMany()
  await prisma.bundle.deleteMany()
  await prisma.productionOrder.deleteMany()

  // Reset machine mapping
  await prisma.machine.updateMany({
    data: {
      roomId: null,
      rowIndex: null,
      positionIndex: null
    }
  })

  console.log('All transaction data cleared successfully.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
