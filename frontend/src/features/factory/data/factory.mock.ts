import type {
  FactoryConfig, Machine, Worker, Bundle, Assignment,
  TimelineEvent, PowerStatus, NetworkStatus, WorkerGrade, AttendanceStatus,
} from '../types/factory.types';

// ─── Helper Factories ─────────────────────────────────────────────────────────

function makeWorker(
  id: string, name: string, dept: string,
  role: string, grade: WorkerGrade, attendance: AttendanceStatus,
): Worker {
  const [h, m] = attendance === 'late' ? [7, 25 + parseInt(id.slice(-1)) * 3] : [7, 2 + parseInt(id.slice(-1))];
  return {
    id, name, photo: undefined, role, department: dept,
    employeeId: `EMP-${id.toUpperCase()}`,
    shiftId: 'shift-morning',
    grade, attendanceToday: attendance,
    checkInTime: `2026-07-03T0${h}:${String(m).padStart(2, '0')}:00.000Z`,
  };
}

function makeBundle(id: string, num: string, style: string, total: number, done: number): Bundle {
  return { id, bundleNumber: num, styleCode: style, totalPieces: total, completedPieces: done, progress: Math.round((done / total) * 100) };
}

function makeAssignment(id: string, workerId: string, machineId: string, op: string, bundleId: string, target: number, done: number): Assignment {
  return {
    id, workerId, machineId,
    operationId: `op-${op.toLowerCase().replace(/\s+/g, '-')}`,
    operationName: op, bundleId,
    startedAt: new Date(Date.now() - (3 - parseInt(id.slice(-1))) * 60 * 60 * 1000).toISOString(),
    targetPieces: target, completedPieces: done,
  };
}

function makeTimeline(status: Machine['status'], bundleNum: string): TimelineEvent[] {
  const templates: Record<Machine['status'], Array<{ time: string; label: string; type: TimelineEvent['type'] }>> = {
    running: [
      { time: '07:00', label: 'Shift started — Machine ready', type: 'start' },
      { time: '07:12', label: `Bundle ${bundleNum} loaded`, type: 'bundle' },
      { time: '08:30', label: 'Supervisor quality check passed', type: 'info' },
      { time: '10:45', label: 'Short break — 10 min', type: 'idle' },
      { time: '10:55', label: 'Production resumed', type: 'bundle' },
    ],
    idle: [
      { time: '07:00', label: 'Shift started', type: 'start' },
      { time: '07:18', label: `Bundle ${bundleNum} loaded`, type: 'bundle' },
      { time: '09:50', label: 'Bundle completed', type: 'info' },
      { time: '09:52', label: 'Waiting for next bundle', type: 'idle' },
    ],
    offline: [
      { time: '07:00', label: 'Shift started', type: 'start' },
      { time: '07:35', label: 'Machine fault detected (E-04)', type: 'offline' },
      { time: '07:40', label: 'Technician notified', type: 'info' },
      { time: '08:05', label: 'Machine taken offline', type: 'offline' },
    ],
    maintenance: [
      { time: '07:00', label: 'Scheduled maintenance started', type: 'maintenance' },
      { time: '08:00', label: 'Parts inspection in progress', type: 'maintenance' },
      { time: '09:15', label: 'Lubrication & tension calibration', type: 'maintenance' },
    ],
    no_worker: [
      { time: '07:00', label: 'Shift started — Machine ready', type: 'start' },
      { time: '07:01', label: 'No worker assigned for today', type: 'info' },
    ],
  };
  return templates[status].map((e, i) => ({ id: `ev-${i}`, ...e }));
}

/** Deterministic temperature based on machine id + status */
function tempFor(id: string, status: Machine['status']): number | null {
  if (status === 'offline') return null;
  if (status === 'maintenance') return 30;
  const n = parseInt(id.replace(/\D/g, '')) || 1;
  const base = status === 'running' ? 42 : status === 'idle' ? 35 : 38;
  return base + (n % 10);
}

function makeMachine(
  id: string, num: string, type: string,
  row: 'top' | 'bottom', index: number,
  status: Machine['status'], dept: string,
  worker: Worker | null, assignment: Assignment | null, bundle: Bundle | null,
  health = 90, uptime = 85, efficiency = 0,
): Machine {
  const resolvedEfficiency = status === 'running' && assignment
    ? Math.round((assignment.completedPieces / assignment.targetPieces) * 100)
    : status === 'idle' ? efficiency || 55
    : 0;

  const powerMap: Record<Machine['status'], PowerStatus> = {
    running: 'on', idle: 'on', offline: 'off', maintenance: 'standby', no_worker: 'on',
  };
  const netMap: Record<Machine['status'], NetworkStatus> = {
    running: 'online', idle: 'online', offline: 'offline', maintenance: 'weak', no_worker: 'online',
  };

  return {
    id, machineNumber: num, machineType: type, status, department: dept,
    worker, assignment, bundle,
    healthScore: health, uptimePercent: uptime,
    efficiency: resolvedEfficiency,
    lastMaintenance: '2026-06-28',
    nextMaintenanceDate: '2026-07-15',
    temperatureC: tempFor(id, status),
    powerStatus: powerMap[status],
    networkStatus: netMap[status],
    todayTimeline: makeTimeline(status, bundle?.bundleNumber ?? 'N/A'),
    position: { row, index },
  };
}

// ─── Workers ──────────────────────────────────────────────────────────────────

const W = {
  aisha:    makeWorker('w001', 'Aisha Banu',      'Stitching',   'Senior Operator', 'A', 'present'),
  roja:     makeWorker('w002', 'Roja Priya',       'Stitching',   'Operator',        'B', 'present'),
  malar:    makeWorker('w003', 'Malar Vizhi',      'Finishing',   'Operator',        'B', 'late'),
  kavya:    makeWorker('w004', 'Kavya Sri',        'Stitching',   'Senior Operator', 'A', 'present'),
  preethi:  makeWorker('w005', 'Preethi Raj',      'Stitching',   'Operator',        'C', 'present'),
  sindhu:   makeWorker('w006', 'Sindhu K.',        'Embroidery',  'Senior Operator', 'B', 'present'),
  meena:    makeWorker('w007', 'Meena Devi',       'Stitching',   'Operator',        'D', 'present'),
  nirmala:  makeWorker('w008', 'Nirmala V.',       'QC',          'QC Inspector',    'B', 'late'),
  sumathi:  makeWorker('w009', 'Sumathi P.',       'Finishing',   'Senior Operator', 'A', 'present'),
  geetha:   makeWorker('w010', 'Geetha Kumari',   'Stitching',   'Operator',        'C', 'present'),
  vimala:   makeWorker('w011', 'Vimala S.',        'Stitching',   'Senior Operator', 'B', 'present'),
  saranya:  makeWorker('w012', 'Saranya M.',       'Embroidery',  'Operator',        'A', 'present'),
  deepa:    makeWorker('w013', 'Deepa Lakshmi',   'Stitching',   'Operator',        'B', 'present'),
  rekha:    makeWorker('w014', 'Rekha R.',         'Finishing',   'Operator',        'C', 'late'),
  leela:    makeWorker('w015', 'Leela Bai',        'Stitching',   'Operator',        'B', 'present'),
  parvathi: makeWorker('w016', 'Parvathi K.',      'Stitching',   'Senior Operator', 'A', 'present'),
  selvi:    makeWorker('w017', 'Selvi N.',         'Finishing',   'QC Inspector',    'B', 'present'),
  usha:     makeWorker('w018', 'Usha Rani',        'Stitching',   'Operator',        'C', 'present'),
  radha:    makeWorker('w019', 'Radha K.',         'Finishing',   'Senior Operator', 'B', 'present'),
  lalitha:  makeWorker('w020', 'Lalitha M.',       'Stitching',   'Senior Operator', 'A', 'present'),
  kamala:   makeWorker('w021', 'Kamala Devi',      'Stitching',   'Operator',        'B', 'present'),
  padma:    makeWorker('w022', 'Padma Priya',      'Embroidery',  'Senior Operator', 'A', 'present'),
  vijaya:   makeWorker('w023', 'Vijaya Laxmi',     'Embroidery',  'Operator',        'C', 'late'),
  hema:     makeWorker('w024', 'Hema Malini',      'Embroidery',  'Operator',        'B', 'present'),
  janaki:   makeWorker('w025', 'Janaki S.',        'QC',          'QC Inspector',    'A', 'present'),
  kumari:   makeWorker('w026', 'Kumari Devi',      'QC',          'Operator',        'B', 'present'),
  revathi:  makeWorker('w027', 'Revathi P.',       'QC',          'Senior Operator', 'C', 'present'),
  savitha:  makeWorker('w028', 'Savitha R.',       'Finishing',   'QC Inspector',    'A', 'present'),
  yamuna:   makeWorker('w029', 'Yamuna K.',        'Finishing',   'Operator',        'B', 'present'),
};

// ─── Bundles ──────────────────────────────────────────────────────────────────

const B = {
  b01: makeBundle('b01', 'BND-2026-001', 'STY-KKT-44', 120, 87),
  b02: makeBundle('b02', 'BND-2026-002', 'STY-KKT-45', 100, 45),
  b03: makeBundle('b03', 'BND-2026-003', 'STY-LDS-22', 80, 72),
  b04: makeBundle('b04', 'BND-2026-004', 'STY-LDS-23', 150, 60),
  b05: makeBundle('b05', 'BND-2026-005', 'STY-GNT-11', 90, 30),
  b06: makeBundle('b06', 'BND-2026-006', 'STY-GNT-12', 110, 110),
  b07: makeBundle('b07', 'BND-2026-007', 'STY-KKT-46', 130, 95),
  b08: makeBundle('b08', 'BND-2026-008', 'STY-LDS-24', 75, 20),
};

// ─── Factory Config v2 ───────────────────────────────────────────────────────

export const FACTORY_CONFIG: FactoryConfig = {
  id: 'factory-001',
  name: 'NFC Garment Production Facility',
  location: 'Chennai, Tamil Nadu',
  lastUpdated: new Date().toISOString(),

  buildings: [
    // ══════════════════════════════════════════════════════════════════
    //  BUILDING A — Main Production Block
    // ══════════════════════════════════════════════════════════════════
    {
      id: 'bld-a',
      name: 'Building A',
      description: 'Main Production Block — Stitching & Finishing',
      floors: [
        {
          id: 'bld-a-f1',
          floorNumber: 1,
          name: 'Floor 1 — Production Floor',
          rooms: [
            // ── STITCHING HALL ─────────────────────────────────────────
            {
              id: 'room-stitch',
              name: 'Stitching Hall',
              description: 'Primary stitching area for knitwear & ladies garments',
              roomType: 'stitching',
              lines: [
                {
                  id: 'line-a', lineNumber: 1, lineName: 'Line A — Knitwear',
                  machines: [
                    // TOP ROW
                    makeMachine('m01','M-001','Overlock','top',0,'no_worker','Stitching',null,null,null, 95, 91),
                    makeMachine('m02','M-002','Flatlock','top',1,'no_worker','Stitching',null,null,null, 88, 85),
                    makeMachine('m03','M-003','Overlock','top',2,'no_worker','Stitching',null,null,null, 78, 72),
                    makeMachine('m04','M-004','Chain Stitch','top',3,'no_worker','Stitching',null,null,null, 90, 88),
                    makeMachine('m05','M-005','SNLS','top',4,'no_worker','Stitching',null,null,null, 52, 60),
                    // BOTTOM ROW
                    makeMachine('m06','M-006','Overlock','bottom',0,'no_worker','Stitching',null,null,null, 91, 89),
                    makeMachine('m07','M-007','Bartack','bottom',1,'no_worker','Finishing',null,null,null, 86, 84),
                    makeMachine('m08','M-008','SNLS','bottom',2,'no_worker','Stitching',null,null,null, 30, 40),
                    makeMachine('m09','M-009','Flatlock','bottom',3,'no_worker','Stitching',null,null,null, 82, 80),
                    makeMachine('m10','M-010','Overlock','bottom',4,'no_worker','Stitching',null,null,null, 99, 98),
                  ],
                },
                {
                  id: 'line-b', lineNumber: 2, lineName: 'Line B — Ladies Garments',
                  machines: [
                    // TOP ROW
                    makeMachine('m11','M-011','SNLS','top',0,'no_worker','Stitching',null,null,null, 97, 95),
                    makeMachine('m12','M-012','Overlock','top',1,'no_worker','Stitching',null,null,null, 89, 86),
                    makeMachine('m13','M-013','Bartack','top',2,'no_worker','Finishing',null,null,null, 74, 70),
                    makeMachine('m14','M-014','Flatlock','top',3,'no_worker','Stitching',null,null,null, 92, 88),
                    makeMachine('m15','M-015','Chain Stitch','top',4,'no_worker','Stitching',null,null,null, 88, 85),
                    // BOTTOM ROW
                    makeMachine('m16','M-016','SNLS','bottom',0,'no_worker','Stitching',null,null,null, 85, 82),
                    makeMachine('m17','M-017','Overlock','bottom',1,'no_worker','Stitching',null,null,null, 91, 89),
                    makeMachine('m18','M-018','Flatlock','bottom',2,'no_worker','Embroidery',null,null,null, 45, 55),
                    makeMachine('m19','M-019','SNLS','bottom',3,'no_worker','Stitching',null,null,null, 87, 84),
                    makeMachine('m20','M-020','Bartack','bottom',4,'no_worker','Finishing',null,null,null, 79, 74),
                  ],
                },
              ],
            },

            // ── FINISHING HALL ─────────────────────────────────────────
            {
              id: 'room-finish',
              name: 'Finishing Hall',
              description: 'Button sewing, pressing & final inspection',
              roomType: 'finishing',
              lines: [
                {
                  id: 'line-c', lineNumber: 3, lineName: 'Line C — Finishing & Pressing',
                  machines: [
                    // TOP ROW
                    makeMachine('m21','M-021','Button Hole','top',0,'no_worker','Finishing',null,null,null, 96, 93),
                    makeMachine('m22','M-022','Button Sew', 'top',1,'no_worker','Finishing',null,null,null, 94, 91),
                    makeMachine('m23','M-023','Bartack',    'top',2,'no_worker','Finishing',null,null,null, 77, 73),
                    makeMachine('m24','M-024','Pressing',   'top',3,'no_worker','Finishing',null,null,null, 82, 78),
                    // BOTTOM ROW
                    makeMachine('m25','M-025','Pressing',   'bottom',0,'no_worker','Finishing',null,null,null, 88, 85),
                    makeMachine('m26','M-026','Button Sew', 'bottom',1,'no_worker','Finishing',null,null,null, 60, 65),
                    makeMachine('m27','M-027','Button Hole','bottom',2,'no_worker','Finishing',null,null,null, 90, 87),
                  ],
                },
              ],
            },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════
    //  BUILDING B — Quality & Packing Block
    // ══════════════════════════════════════════════════════════════════
    {
      id: 'bld-b',
      name: 'Building B',
      description: 'Quality & Packing Block — Embroidery, QC, Dispatch',
      floors: [
        {
          id: 'bld-b-f1',
          floorNumber: 1,
          name: 'Floor 1 — Processing Floor',
          rooms: [
            // ── EMBROIDERY ROOM ────────────────────────────────────────
            {
              id: 'room-embroidery',
              name: 'Embroidery Room',
              description: 'Logo & brand embroidery for all styles',
              roomType: 'embroidery',
              lines: [
                {
                  id: 'line-d', lineNumber: 4, lineName: 'Line D — Embroidery',
                  machines: [
                    // TOP ROW
                    makeMachine('m28','M-028','Embroidery','top',0,'no_worker','Embroidery',null,null,null, 93, 91),
                    makeMachine('m29','M-029','Embroidery','top',1,'no_worker','Embroidery',null,null,null, 91, 89),
                    makeMachine('m30','M-030','Embroidery','top',2,'no_worker','Embroidery',null,null,null, 84, 80),
                    // BOTTOM ROW
                    makeMachine('m31','M-031','Embroidery','bottom',0,'no_worker','Embroidery',null,null,null, 88, 86),
                    makeMachine('m32','M-032','Embroidery','bottom',1,'no_worker','Embroidery',null,null,null, 15, 20),
                  ],
                },
              ],
            },

            // ── QC & PACKING HALL ──────────────────────────────────────
            {
              id: 'room-qc',
              name: 'QC & Packing Hall',
              description: 'Final quality inspection and dispatch packing',
              roomType: 'qc',
              lines: [
                {
                  id: 'line-e', lineNumber: 5, lineName: 'Line E — QC & Packing',
                  machines: [
                    // TOP ROW
                    makeMachine('m33','M-033','QC Table','top',0,'no_worker','QC',null,null,null, 90, 88),
                    makeMachine('m34','M-034','QC Table','top',1,'no_worker','QC',null,null,null, 85, 82),
                    makeMachine('m35','M-035','Pressing', 'top',2,'no_worker','Finishing',null,null,null, 78, 74),
                    // BOTTOM ROW
                    makeMachine('m36','M-036','Packing',  'bottom',0,'no_worker','QC',null,null,null, 88, 85),
                    makeMachine('m37','M-037','QC Table', 'bottom',1,'no_worker','QC',null,null,null, 92, 90),
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
