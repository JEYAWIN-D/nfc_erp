import apiClient from '@/services/axios';
import type { WorkerData, WorkerFormData, WorkerStatus } from '../types/worker.types';

// Interface for Backend Response
export interface WorkerAPIResponse {
  id: number;
  employeeCode: string;
  nfcCardId: string;
  firstName: string;
  lastName: string;
  departmentId: number;
  gradeId: number;
  status: string;
  department: {
    id: number;
    name: string;
    code: string;
  };
  grade: {
    id: number;
    code: string;
    name: string;
  };
  skills?: Array<{
    skill: {
      name: string;
    }
  }>;
  assignments?: Array<{
    machine?: { machineCode: string };
    operation?: { operationName: string };
    machineId?: number;
    operationId?: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Temporary static mappings to map Frontend string selections to Backend IDs 
// In a full production app, these would be dynamic lookups
const DEPT_MAP: Record<string, number> = {
  'Stitching': 1,
  'Cutting': 2,
  'Finishing': 3,
  'Packing': 4,
};

const GRADE_MAP: Record<string, number> = {
  'A': 1,
  'B': 2,
  'C': 3,
  'D': 4,
};

// Map backend API data to frontend UI format
export const mapWorkerAPIToUI = (data: WorkerAPIResponse, attendanceLogs: any[] = []): WorkerData => {
  let todayCheckIn: string | undefined = undefined;
  let todayCheckOut: string | undefined = undefined;
  let attendanceState: 'present' | 'checked_out' | 'assigned_not_present' = 'assigned_not_present';

  const mappedAttendanceRecords = attendanceLogs.map((att: any) => {
    const isToday = new Date(att.tapTime).toDateString() === new Date().toDateString();
    if (isToday) {
      if (att.attendanceType === 'IN' && !todayCheckIn) {
        todayCheckIn = att.tapTime;
        attendanceState = 'present';
      }
      if (att.attendanceType === 'OUT' && !todayCheckOut) {
        todayCheckOut = att.tapTime;
        attendanceState = 'checked_out';
      }
    }

    return {
      date: new Date(att.tapTime).toLocaleDateString(),
      status: att.attendanceType === 'IN' ? ('present' as const) : ('absent' as const),
      checkIn: att.attendanceType === 'IN' ? new Date(att.tapTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : undefined,
      checkOut: att.attendanceType === 'OUT' ? new Date(att.tapTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : undefined,
      workingHours: 8,
    };
  });

  const history = attendanceLogs.map((att: any, idx: number) => ({
    id: `hist-${att.id || idx}`,
    date: new Date(att.tapTime).toLocaleDateString(),
    operationName: att.assignment?.operation?.operationName || (data as any).productionTasks?.[0]?.operation?.name || (data.assignments?.[0] as any)?.operation?.operationName || 'Sewing / Assembly',
    productionOrder: (data as any).productionTasks?.[0]?.productionOrder?.orderNumber || 'PO-1001',
    projectName: (data as any).productionTasks?.[0]?.productionOrder?.styleName || 'Garment Style',
    machineCode: att.machine?.machineCode || (data.assignments?.[0]?.machine as any)?.machineCode || 'M-101',
    startTime: att.attendanceType === 'IN' ? new Date(att.tapTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
    endTime: att.attendanceType === 'OUT' ? new Date(att.tapTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
    status: att.attendanceType === 'IN' ? 'IN_PROGRESS' : 'COMPLETED',
  }));

  const currentAssignment = data.assignments && data.assignments.length > 0 ? {
    machineId: data.assignments[0].machine?.machineCode || `MAC-${(data.assignments[0] as any).machineId}`,
    operation: (data as any).productionTasks?.[0]?.operation?.name || (data.assignments[0] as any).operation?.operationName || 'Assigned Operation',
    project: (data as any).productionTasks?.[0]?.productionOrder?.styleName || 'N/A',
    productionOrder: (data as any).productionTasks?.[0]?.productionOrder?.orderNumber || 'N/A',
    department: (data as any).productionTasks?.[0]?.department?.name || data.department?.name || 'General',
    status: 'active' as const,
    assignedAt: new Date((data.assignments[0] as any).assignedAt || new Date()),
    checkInTime: todayCheckIn,
    checkOutTime: todayCheckOut,
    attendanceState,
  } : undefined;

  return {
    id: data.employeeCode, // UI uses employeeCode as ID in many places
    employeeCode: data.employeeCode,
    firstName: data.firstName,
    lastName: data.lastName,
    department: data.department?.name || 'Unknown',
    grade: (data.grade?.code || 'C') as any,
    primarySkill: data.skills && data.skills.length > 0 ? data.skills[0].skill.name : 'Unassigned',
    secondarySkills: data.skills && data.skills.length > 1 ? data.skills.slice(1).map(s => s.skill.name) : [],
    shift: 'Morning',
    nfcCardId: data.nfcCardId || '',
    currentAssignment,
    joiningDate: new Date(data.createdAt),
    status: (data.status?.toLowerCase() || 'active') as WorkerStatus,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    
    attendanceRecords: mappedAttendanceRecords,
    productionHistory: [],
    timeline: [],
    history,
    todayCheckIn,
    todayCheckOut,
  };
};

export const workerService = {
  async getWorkers() {
    const { data } = await apiClient.get<{ success: boolean; data: { data: WorkerAPIResponse[] } }>('/workers?limit=2000');
    return data.data.data.map(w => mapWorkerAPIToUI(w));
  },

  async getWorker(id: string) {
    const { data } = await apiClient.get<{ success: boolean; data: { data: WorkerAPIResponse[] } }>(`/workers?employeeCode=${id}`);
    const worker = data.data.data.find(w => w.employeeCode === id);
    if (!worker) throw new Error("Worker not found");

    let attendanceLogs: any[] = [];
    try {
      const { data: attRes } = await apiClient.get(`/attendance/worker/${worker.id}`);
      attendanceLogs = attRes.data || [];
    } catch {}

    return mapWorkerAPIToUI(worker, attendanceLogs);
  },

  async createWorker(worker: WorkerFormData) {
    const payload = {
      employeeCode: worker.employeeCode,
      firstName: worker.firstName,
      lastName: worker.lastName,
      nfcCardId: worker.nfcCardId || worker.employeeCode,
      departmentId: DEPT_MAP[worker.department] || 1,
      gradeId: GRADE_MAP[worker.grade] || 3,
      status: (worker.status?.toUpperCase() || 'ACTIVE') as any,
      // optional fields that backend might accept
      email: worker.email || `${worker.firstName.toLowerCase()}.${worker.lastName.toLowerCase()}@factory.com`,
      phone: worker.phone || "0000000000",
      joiningDate: worker.joiningDate.toISOString(),
    };
    
    const { data } = await apiClient.post<{ success: boolean; data: WorkerAPIResponse }>('/workers', payload);
    // Return mapped data (but we might need to fetch again to get relations like dept name, 
    // assuming backend returns them in create response or we handle it via refetch)
    return data.data;
  },

  async updateWorker(id: string, worker: Partial<WorkerFormData>) {
    // Need to find numeric ID first
    const { data: searchData } = await apiClient.get<{ success: boolean; data: { data: WorkerAPIResponse[] } }>(`/workers?employeeCode=${id}`);
    const target = searchData.data.data.find(w => w.employeeCode === id);
    if (!target) throw new Error("Worker not found");

    const payload: any = {};
    if (worker.firstName) payload.firstName = worker.firstName;
    if (worker.lastName) payload.lastName = worker.lastName;
    if (worker.department) payload.departmentId = DEPT_MAP[worker.department] || target.departmentId;
    if (worker.grade) payload.gradeId = GRADE_MAP[worker.grade] || target.gradeId;
    if (worker.nfcCardId) payload.nfcCardId = worker.nfcCardId;

    const { data } = await apiClient.put<{ success: boolean; data: WorkerAPIResponse }>(`/workers/${target.id}`, payload);
    return data.data;
  },

  async deleteWorker(id: string) {
    // Soft delete / change status to terminated/inactive
    const { data: searchData } = await apiClient.get<{ success: boolean; data: { data: WorkerAPIResponse[] } }>(`/workers?employeeCode=${id}`);
    const target = searchData.data.data.find(w => w.employeeCode === id);
    if (!target) throw new Error("Worker not found");

    const { data } = await apiClient.patch<{ success: boolean; data: WorkerAPIResponse }>(`/workers/${target.id}/status`, {
      status: 'INACTIVE'
    });
    return data.data;
  }
};
