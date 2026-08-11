import prisma from '../src/config/prisma';

async function main() {
  console.log('🌱 Starting comprehensive seed script...');

  // =============================================
  // 1. FOUNDATION DATA
  // =============================================
  console.log('Creating departments...');
  const deptSewing = await prisma.department.upsert({
    where: { code: 'DEPT-SEW' },
    update: {},
    create: { code: 'DEPT-SEW', name: 'Sewing', description: 'Main sewing production floor - Line A & B' }
  });
  const deptCutting = await prisma.department.upsert({
    where: { code: 'DEPT-CUT' },
    update: {},
    create: { code: 'DEPT-CUT', name: 'Cutting', description: 'Fabric cutting and preparation area' }
  });
  const deptFinishing = await prisma.department.upsert({
    where: { code: 'DEPT-FIN' },
    update: {},
    create: { code: 'DEPT-FIN', name: 'Finishing', description: 'Finishing, ironing and packing' }
  });
  const deptQC = await prisma.department.upsert({
    where: { code: 'DEPT-QC' },
    update: {},
    create: { code: 'DEPT-QC', name: 'Quality Control', description: 'Inline and end-of-line QC' }
  });

  console.log('Creating machine types...');
  const mtJuki = await prisma.machineType.upsert({
    where: { code: 'MT-JUKI' },
    update: {},
    create: { code: 'MT-JUKI', name: 'Juki Single Needle' }
  });
  const mtBrother = await prisma.machineType.upsert({
    where: { code: 'MT-BROT' },
    update: {},
    create: { code: 'MT-BROT', name: 'Brother Overlock' }
  });
  const mtPfaff = await prisma.machineType.upsert({
    where: { code: 'MT-PFAFF' },
    update: {},
    create: { code: 'MT-PFAFF', name: 'Pfaff Bartack' }
  });
  const mtSinger = await prisma.machineType.upsert({
    where: { code: 'MT-SING' },
    update: {},
    create: { code: 'MT-SING', name: 'Singer Feed-Off-Arm' }
  });

  console.log('Creating shifts...');
  const shiftMorning = await prisma.shift.upsert({
    where: { shiftCode: 'SH-A' },
    update: {},
    create: { shiftCode: 'SH-A', shiftName: 'Morning Shift A', startTime: '07:00', endTime: '15:00', breakStart: '12:00', breakEnd: '12:30', workingHours: 7.5 }
  });
  const shiftEvening = await prisma.shift.upsert({
    where: { shiftCode: 'SH-B' },
    update: {},
    create: { shiftCode: 'SH-B', shiftName: 'Evening Shift B', startTime: '15:00', endTime: '23:00', breakStart: '19:00', breakEnd: '19:30', workingHours: 7.5 }
  });

  console.log('Creating worker grades...');
  const gradeA = await prisma.workerGrade.upsert({
    where: { code: 'GR-A' },
    update: {},
    create: { code: 'GR-A', name: 'Grade A - Expert', description: 'Highly skilled senior operator', priority: 1 }
  });
  const gradeB = await prisma.workerGrade.upsert({
    where: { code: 'GR-B' },
    update: {},
    create: { code: 'GR-B', name: 'Grade B - Skilled', description: 'Skilled machine operator', priority: 2 }
  });
  const gradeC = await prisma.workerGrade.upsert({
    where: { code: 'GR-C' },
    update: {},
    create: { code: 'GR-C', name: 'Grade C - Trainee', description: 'Trainee / Junior operator', priority: 3 }
  });

  console.log('Creating skills...');
  const skillCollar = await prisma.skill.upsert({
    where: { code: 'SK-COLLAR' },
    update: {},
    create: { code: 'SK-COLLAR', name: 'Collar Attaching', description: 'Attach collar to body' }
  });
  const skillSleeve = await prisma.skill.upsert({
    where: { code: 'SK-SLEEVE' },
    update: {},
    create: { code: 'SK-SLEEVE', name: 'Sleeve Setting', description: 'Set sleeves on garment body' }
  });
  const skillOverlock = await prisma.skill.upsert({
    where: { code: 'SK-OVER' },
    update: {},
    create: { code: 'SK-OVER', name: 'Overlocking', description: 'Serging & edge finishing' }
  });

  console.log('Creating operations...');
  const opBodyJoin = await prisma.operation.upsert({
    where: { operationCode: 'OP-BJO' },
    update: {},
    create: { operationCode: 'OP-BJO', operationName: 'Body Joining', standardMinuteValue: 1.2, displayOrder: 1, requiredSkillId: skillCollar.id }
  });
  const opCollar = await prisma.operation.upsert({
    where: { operationCode: 'OP-CATT' },
    update: {},
    create: { operationCode: 'OP-CATT', operationName: 'Collar Attaching', standardMinuteValue: 1.5, displayOrder: 2, requiredSkillId: skillCollar.id }
  });
  const opSleeve = await prisma.operation.upsert({
    where: { operationCode: 'OP-SLVS' },
    update: {},
    create: { operationCode: 'OP-SLVS', operationName: 'Sleeve Setting', standardMinuteValue: 2.0, displayOrder: 3, requiredSkillId: skillSleeve.id }
  });
  const opSideSeam = await prisma.operation.upsert({
    where: { operationCode: 'OP-SSAM' },
    update: {},
    create: { operationCode: 'OP-SSAM', operationName: 'Side Seam', standardMinuteValue: 1.8, displayOrder: 4, requiredSkillId: skillOverlock.id }
  });
  const opHemming = await prisma.operation.upsert({
    where: { operationCode: 'OP-HEM' },
    update: {},
    create: { operationCode: 'OP-HEM', operationName: 'Bottom Hemming', standardMinuteValue: 0.9, displayOrder: 5, requiredSkillId: skillOverlock.id }
  });
  const opFinalQC = await prisma.operation.upsert({
    where: { operationCode: 'OP-FQC' },
    update: {},
    create: { operationCode: 'OP-FQC', operationName: 'Final QC Inspection', standardMinuteValue: 0.5, displayOrder: 6 }
  });

  // =============================================
  // 2. TERMINALS, MACHINES, WORKERS
  // =============================================
  console.log('Creating terminals & machines...');
  const terminals = [];
  for (let i = 1; i <= 140; i++) {
    const t = await prisma.terminal.upsert({
      where: { terminalCode: `TERM-${i.toString().padStart(3,'0')}` },
      update: { lastHeartbeat: new Date() },
      create: {
        terminalCode: `TERM-${i.toString().padStart(3,'0')}`,
        terminalName: `Terminal ${i}`,
        ipAddress: `192.168.10.${100 + (i % 150)}`,
        macAddress: `AA:BB:CC:DD:EE:${(i % 99).toString().padStart(2,'0')}`,
        firmwareVersion: 'v2.1.4',
        lastHeartbeat: new Date()
      }
    });
    terminals.push(t);
  }

  const machines = [];
  for (let i = 1; i <= 140; i++) {
    const isBrother = i % 3 === 0;
    const isPfaff = i % 7 === 0;
    
    const type = isPfaff ? mtPfaff : isBrother ? mtBrother : mtJuki;
    const dept = isPfaff ? deptCutting : isBrother ? deptFinishing : deptSewing;
    const code = `MCH-${i.toString().padStart(3,'0')}`;
    const name = `${type.name} - ${i}`;
    
    try {
      const machine = await prisma.machine.upsert({
        where: { machineCode: code },
        update: {},
        create: { 
            machineCode: code, 
            machineName: name, 
            departmentId: dept.id, 
            machineTypeId: type.id, 
            terminalId: terminals[i-1].id 
        }
      });
      machines.push(machine);
    } catch (e: any) {
      // If terminal already linked, find existing machine or skip
      const existing = await prisma.machine.findFirst({ where: { terminalId: terminals[i-1].id } });
      if (existing) machines.push(existing);
    }
  }

  console.log('Creating workers...');
  const workerData = [
    { code: 'EMP-0001', nfc: 'NFC-AA0001', first: 'Ravi', last: 'Kumar', gender: 'M', dept: deptSewing, grade: gradeA },
    { code: 'EMP-0002', nfc: 'NFC-AA0002', first: 'Priya', last: 'Devi', gender: 'F', dept: deptSewing, grade: gradeA },
    { code: 'EMP-0003', nfc: 'NFC-AA0003', first: 'Suresh', last: 'Babu', gender: 'M', dept: deptSewing, grade: gradeB },
    { code: 'EMP-0004', nfc: 'NFC-AA0004', first: 'Meena', last: 'Raj', gender: 'F', dept: deptSewing, grade: gradeB },
    { code: 'EMP-0005', nfc: 'NFC-AA0005', first: 'Arjun', last: 'Singh', gender: 'M', dept: deptSewing, grade: gradeA },
    { code: 'EMP-0006', nfc: 'NFC-AA0006', first: 'Lakshmi', last: 'Nair', gender: 'F', dept: deptCutting, grade: gradeB },
    { code: 'EMP-0007', nfc: 'NFC-AA0007', first: 'Ganesh', last: 'Murthy', gender: 'M', dept: deptFinishing, grade: gradeB },
    { code: 'EMP-0008', nfc: 'NFC-AA0008', first: 'Kavitha', last: 'Krishnan', gender: 'F', dept: deptSewing, grade: gradeC },
    { code: 'EMP-0009', nfc: 'NFC-AA0009', first: 'Dinesh', last: 'Pandey', gender: 'M', dept: deptQC, grade: gradeA },
    { code: 'EMP-0010', nfc: 'NFC-AA0010', first: 'Anitha', last: 'Subramanian', gender: 'F', dept: deptSewing, grade: gradeC },
  ];

  // Dynamically generate 50 additional workers
  const firstNames = ['Amit', 'Raj', 'Sita', 'Gita', 'Mohan', 'Suresh', 'Ramesh', 'Rani', 'Geeta', 'Neha', 'Pooja', 'Vikram', 'Anil', 'Sunil', 'Kiran', 'Asha', 'Usha', 'Deepa', 'Jyoti', 'Kavita', 'Manoj', 'Rakesh', 'Sanjay', 'Vijay', 'Ajay'];
  const lastNames = ['Kumar', 'Sharma', 'Singh', 'Patel', 'Yadav', 'Gupta', 'Verma', 'Reddy', 'Nair', 'Menon', 'Iyer', 'Das', 'Bose', 'Dutta', 'Chowdhury', 'Sen', 'Pillai', 'Rao', 'Deshmukh', 'Patil'];
  for (let i = 11; i <= 60; i++) {
    const first = firstNames[i % firstNames.length];
    const last = lastNames[i % lastNames.length];
    const gender = i % 2 === 0 ? 'M' : 'F';
    const dept = i % 3 === 0 ? deptCutting : i % 2 === 0 ? deptFinishing : deptSewing;
    const grade = i % 5 === 0 ? gradeA : i % 2 === 0 ? gradeB : gradeC;
    workerData.push({ code: `EMP-${i.toString().padStart(4, '0')}`, nfc: `NFC-AA${i.toString().padStart(4, '0')}`, first, last, gender, dept, grade });
  }

  const workers = [];
  for (const w of workerData) {
    const worker = await prisma.worker.upsert({
      where: { employeeCode: w.code },
      update: {},
      create: {
        employeeCode: w.code, nfcCardId: w.nfc, firstName: w.first, lastName: w.last, gender: w.gender,
        departmentId: w.dept.id, gradeId: w.grade.id,
        joiningDate: new Date(Date.now() - Math.random() * 365 * 3 * 24 * 60 * 60 * 1000)
      }
    });
    workers.push(worker);
  }

  // Assign skills to workers
  for (const worker of workers.slice(0, 5)) {
    await prisma.workerSkill.upsert({
      where: { workerId_skillId: { workerId: worker.id, skillId: skillCollar.id } },
      update: {}, create: { workerId: worker.id, skillId: skillCollar.id }
    });
    await prisma.workerSkill.upsert({
      where: { workerId_skillId: { workerId: worker.id, skillId: skillSleeve.id } },
      update: {}, create: { workerId: worker.id, skillId: skillSleeve.id }
    });
  }
  for (const worker of workers.slice(5, 10)) {
    await prisma.workerSkill.upsert({
      where: { workerId_skillId: { workerId: worker.id, skillId: skillOverlock.id } },
      update: {}, create: { workerId: worker.id, skillId: skillOverlock.id }
    });
  }

  // =============================================
  // 3. PRODUCTION ORDERS
  // =============================================
  console.log('Creating production orders...');
  const poData = [
    { num: 'PO-2026-001', buyer: 'Nike Inc.', style: 'NK-DRY-FIT-01', name: 'Dri-FIT Training Tee', color: 'Black', size: 'Assorted', qty: 8000, status: 'IN_PROGRESS' as const, daysOffset: -5, duration: 14 },
    { num: 'PO-2026-002', buyer: 'Adidas AG', style: 'AD-POLO-22', name: 'Adidas Sport Polo', color: 'Navy Blue', size: 'M/L', qty: 5000, status: 'IN_PROGRESS' as const, daysOffset: -2, duration: 10 },
    { num: 'PO-2026-003', buyer: 'H&M Group', style: 'HM-CASUAL-07', name: 'H&M Basic Casual Shirt', color: 'White', size: 'S/M/L/XL', qty: 12000, status: 'PLANNED' as const, daysOffset: 3, duration: 20 },
    { num: 'PO-2026-004', buyer: 'Zara (Inditex)', style: 'ZR-DRESS-14', name: 'Zara Summer Dress', color: 'Floral Print', size: 'XS/S/M', qty: 3000, status: 'COMPLETED' as const, daysOffset: -15, duration: 10 },
    { num: 'PO-2026-005', buyer: 'Marks & Spencer', style: 'MS-FORMAL-09', name: 'M&S Formal Button Shirt', color: 'Light Blue', size: 'M/L/XL', qty: 4500, status: 'PLANNED' as const, daysOffset: 7, duration: 12 },
  ];

  const productionOrders = [];
  for (const po of poData) {
    const startDate = new Date(Date.now() + po.daysOffset * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + po.duration * 24 * 60 * 60 * 1000);
    const completedQty = po.status === 'COMPLETED' ? po.qty : po.status === 'IN_PROGRESS' ? Math.floor(po.qty * 0.45) : 0;
    const order = await prisma.productionOrder.upsert({
      where: { orderNumber: po.num },
      update: {},
      create: {
        orderNumber: po.num, buyerName: po.buyer, styleNumber: po.style, styleName: po.name,
        color: po.color, size: po.size, plannedQuantity: po.qty, completedQuantity: completedQty,
        plannedStartDate: startDate, plannedEndDate: endDate, status: po.status,
        priority: po.status === 'IN_PROGRESS' ? 1 : 0
      }
    });
    productionOrders.push(order);
  }

  // =============================================
  // 4. BUNDLES
  // =============================================
  console.log('Creating bundles & transactions...');
  const bundleStatuses = ['IN_PROGRESS', 'COMPLETED', 'CREATED', 'WAITING'] as const;
  const createdBundles = [];

  // Create 20 bundles for first 2 POs
  for (let i = 1; i <= 20; i++) {
    const po = productionOrders[i <= 10 ? 0 : 1];
    const status = bundleStatuses[i % bundleStatuses.length];
    const bundleNum = `BUN-${po.orderNumber.replace('PO-2026-', '')}-${i.toString().padStart(3,'0')}`;
    
    try {
      const bundle = await prisma.bundle.upsert({
        where: { bundleNumber: bundleNum },
        update: {},
        create: {
          bundleNumber: bundleNum, productionOrderId: po.id,
          currentOperationId: i % 2 === 0 ? opCollar.id : opSleeve.id,
          currentMachineId: machines[i % machines.length].id,
          currentWorkerId: workers[i % workers.length].id,
          quantity: 50, completedQuantity: status === 'COMPLETED' ? 50 : Math.floor(Math.random() * 40),
          status
        }
      });
      createdBundles.push(bundle);
    } catch (e) { /* skip if exists */ }
  }

  // =============================================
  // 5. BUNDLE TRANSACTIONS & QC
  // =============================================
  console.log('Creating transactions & QC records...');
  for (let i = 0; i < Math.min(createdBundles.length, 10); i++) {
    const bundle = createdBundles[i];
    const worker = workers[i % workers.length];
    const machine = machines[i % machines.length];
    const po = productionOrders[0];

    try {
      const trx = await prisma.bundleTransaction.create({
        data: {
          bundleId: bundle.id, productionOrderId: po.id, fromOperationId: opCollar.id,
          fromWorkerId: worker.id, fromMachineId: machine.id, quantity: 50, transactionType: 'START'
        }
      });

      // QC for some bundles
      if (i % 3 === 0) {
        await prisma.qC.create({
          data: {
            bundleId: bundle.id, transactionId: trx.id,
            inspectorName: workers[8].firstName + ' ' + workers[8].lastName,
            workerId: worker.id, machineId: machine.id,
            passQuantity: 48, rejectQuantity: 1, reworkQuantity: 1,
            remarks: 'Minor stitch length variation on collar seam.'
          }
        });
      }
    } catch (e) { /* skip on conflict */ }
  }

  // =============================================
  // 6. ASSIGNMENTS & ATTENDANCE & MACHINE_OPERATION
  // =============================================
  console.log('Creating assignments & attendance...');
  for (let i = 0; i < Math.min(workers.length, 8); i++) {
    try {
      const assignment = await prisma.assignment.create({
        data: {
          workerId: workers[i].id, machineId: machines[i].id,
          operationId: i % 2 === 0 ? opCollar.id : opSleeve.id,
          shiftId: i % 2 === 0 ? shiftMorning.id : shiftEvening.id,
          status: 'ACTIVE'
        }
      });

      // Machine operation assignment
      await prisma.machineOperationAssignment.upsert({
        where: { machineId_shiftId: { machineId: machines[i].id, shiftId: i % 2 === 0 ? shiftMorning.id : shiftEvening.id } },
        update: {},
        create: {
          machineId: machines[i].id, operationId: i % 2 === 0 ? opCollar.id : opSleeve.id,
          shiftId: i % 2 === 0 ? shiftMorning.id : shiftEvening.id, status: 'ACTIVE'
        }
      });

      // Attendance for each assignment
      const terminal = terminals[i];
      await prisma.attendance.create({
        data: {
          workerId: workers[i].id, assignmentId: assignment.id,
          terminalId: terminal.id, machineId: machines[i].id,
          shiftId: shiftMorning.id, attendanceType: 'IN',
          tapTime: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
        }
      });
    } catch (e) { /* skip on conflict */ }
  }

  // =============================================
  // 7. PRODUCTION TASKS (for Planning board)
  // =============================================
  console.log('Creating production tasks...');
  const taskStatuses = ['CREATED', 'PLANNED', 'ASSIGNED', 'RUNNING', 'COMPLETED'] as const;
  for (let i = 1; i <= 15; i++) {
    const taskId = `TSK-2026-${i.toString().padStart(4,'0')}`;
    const po = productionOrders[i % productionOrders.length];
    const status = taskStatuses[i % taskStatuses.length];
    try {
      await prisma.productionTask.upsert({
        where: { taskId },
        update: {},
        create: {
          taskId, productionOrderId: po.id,
          operationId: [opBodyJoin, opCollar, opSleeve, opSideSeam, opHemming][i % 5].id,
          departmentId: deptSewing.id,
          machineId: i <= 10 ? machines[i % machines.length].id : undefined,
          workerId: i <= 8 ? workers[i % workers.length].id : undefined,
          shiftId: i % 2 === 0 ? shiftMorning.id : shiftEvening.id,
          estimatedTime: [60, 90, 120, 75, 45][i % 5],
          targetQuantity: 50, priority: i <= 3 ? 1 : 0, status
        }
      });
    } catch (e) { /* skip */ }
  }

  console.log('✅ Comprehensive seed completed!');
  console.log('Summary:');
  console.log(`  - 4 Departments`);
  console.log(`  - 4 Machine Types`);
  console.log(`  - 2 Shifts`);
  console.log(`  - 3 Grades, 3 Skills`);
  console.log(`  - 6 Operations`);
  console.log(`  - 140 Terminals & 140 Machines`);
  console.log(`  - 10 Workers`);
  console.log(`  - 5 Production Orders (Nike, Adidas, H&M, Zara, M&S)`);
  console.log(`  - 20 Bundles with Transactions`);
  console.log(`  - QC Records, Assignments, Attendance, Planning Tasks`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
