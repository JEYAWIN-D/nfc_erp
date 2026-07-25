import apiClient from '@/services/axios';
import type { MachineData, MachineFormData, MachineStatus, MachineHealth, MachineType } from '../types/machine.types';

// Interface for Backend Response
export interface MachineAPIResponse {
  id: number;
  machineCode: string;
  machineName: string;
  departmentId: number;
  machineTypeId: number;
  terminalId: number;
  roomId?: number;
  rowIndex?: number;
  positionIndex?: number;
  status: string;
  department?: {
    id: number;
    name: string;
  };
  machineType?: {
    id: number;
    name: string;
  };
  terminal?: {
    id: number;
    name: string;
    terminalCode: string;
  };
  assignments?: Array<{
    id: number;
    workerId: number;
    machineId: number;
    operationId?: number;
    shiftId?: number;
    assignedAt: string;
    status: string;
    worker?: {
      id: number;
      firstName: string;
      lastName: string;
      employeeCode: string;
    };
    operation?: {
      operationName: string;
    };
    shift?: {
      name: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

// Static Mappings for IDs
const DEPT_MAP: Record<string, number> = {
  'Stitching': 1,
  'Cutting': 2,
  'Finishing': 3,
  'Packing': 4,
};

const MACHINE_TYPE_MAP: Record<string, number> = {
  "Single Needle": 1,
  "Double Needle": 2,
  "Overlock": 3,
  "Flatlock": 4,
  "Interlock": 5,
  "Bar Tack": 6,
  "Button Hole": 7,
  "Feed Off Arm": 8,
  "Embroidery": 9,
  "Cutting": 10,
};

// Map backend API data to frontend UI format
export const mapMachineAPIToUI = (data: MachineAPIResponse, latestAttendance?: any): MachineData => {
  let attendanceState: 'present' | 'checked_out' | 'assigned_not_present' = 'assigned_not_present';
  let checkInTime: string | undefined = undefined;
  let checkOutTime: string | undefined = undefined;

  if (latestAttendance) {
    if (latestAttendance.attendanceType === 'IN') {
      attendanceState = 'present';
      checkInTime = latestAttendance.tapTime;
    } else if (latestAttendance.attendanceType === 'OUT') {
      attendanceState = 'checked_out';
      checkOutTime = latestAttendance.tapTime;
    }
  }

  return {
    id: data.machineCode,
    machineId: data.machineCode,
    name: data.machineName,
    department: data.department?.name || 'Unknown',
    type: (data.machineType?.name || 'Single Needle') as MachineType,
    building: 'Main',
    floor: '1',
    room: (data as any).room?.name || 'Unassigned',
    productionLine: 'Line 1',
    status: attendanceState === 'present' ? 'running' : (attendanceState === 'checked_out' ? 'offline' : (data.assignments && data.assignments.length > 0 ? 'idle' : 'offline')),
    health: 'healthy' as MachineHealth,
    healthScore: 95,
    terminalId: data.terminal?.terminalCode || String(data.terminalId),
    terminalName: data.terminal?.name,
    runningHours: 0,
    temperature: 30,
    powerConsumption: 100,
    currentAssignment: data.assignments && data.assignments.length > 0 ? {
      workerId: data.assignments[0].worker?.employeeCode || String(data.assignments[0].workerId),
      workerName: data.assignments[0].worker ? `${data.assignments[0].worker.firstName} ${data.assignments[0].worker.lastName}` : "Unknown Worker",
      operation: (data as any).productionTasks?.[0]?.operation?.name || data.assignments[0].operation?.operationName || "Unknown Operation",
      project: (data as any).productionTasks?.[0]?.productionOrder?.styleName || 'N/A',
      productionOrder: (data as any).productionTasks?.[0]?.productionOrder?.orderNumber || 'N/A',
      department: (data as any).productionTasks?.[0]?.department?.name || data.department?.name || 'General',
      assignedAt: data.assignments[0].assignedAt,
      shift: data.assignments[0].shift?.name || "Morning",
      checkInTime,
      checkOutTime,
      attendanceState,
    } : undefined,
    currentBundle: undefined,
    todayTarget: 0,
    todayCompleted: 0,
    efficiency: 0,
    currentOperation: data.assignments && data.assignments.length > 0 ? (data.assignments[0].operation?.operationName || "Unknown Operation") : undefined,
    lastHeartbeat: new Date().toISOString(),
    purchaseDate: data.createdAt,
    maintenanceHistory: [],
    productionHistory: [],
    timeline: []
  };
};

export const machineService = {
  async getMachines() {
    const { data } = await apiClient.get<{ success: boolean; data: { data: MachineAPIResponse[] } }>('/machines?limit=2000');
    return data.data.data.map(m => mapMachineAPIToUI(m));
  },

  async getMachine(id: string) {
    const { data } = await apiClient.get<{ success: boolean; data: { data: MachineAPIResponse[] } }>(`/machines?machineCode=${id}`);
    const machine = data.data.data.find(m => m.machineCode === id);
    if (!machine) throw new Error("Machine not found");

    let latestAttendance = null;
    if (machine.assignments && machine.assignments.length > 0 && machine.assignments[0].workerId) {
      try {
        const { data: attRes } = await apiClient.get(`/attendance/today`);
        const workerAtts = (attRes.data || []).filter((a: any) => a.workerId === machine.assignments![0].workerId);
        if (workerAtts.length > 0) {
          latestAttendance = workerAtts.sort((a: any, b: any) => new Date(b.tapTime).getTime() - new Date(a.tapTime).getTime())[0];
        }
      } catch {}
    }

    return mapMachineAPIToUI(machine, latestAttendance);
  },

  async createMachine(machine: MachineFormData) {
    const payload = {
      machineCode: machine.machineId,
      machineName: machine.name,
      departmentId: DEPT_MAP[machine.department] || 1,
      machineTypeId: MACHINE_TYPE_MAP[machine.type] || 1,
      terminalId: machine.terminalId ? parseInt(machine.terminalId) || 1 : 1,
      status: 'ACTIVE',
      ...(machine.room && machine.room !== "none" && { roomId: parseInt(machine.room) })
    };
    
    const { data } = await apiClient.post<{ success: boolean; data: MachineAPIResponse }>('/machines', payload);
    return data.data;
  },

  async updateMachine(id: string, machine: Partial<MachineFormData>) {
    const { data: searchData } = await apiClient.get<{ success: boolean; data: { data: MachineAPIResponse[] } }>(`/machines?machineCode=${id}`);
    const target = searchData.data.data.find(m => m.machineCode === id);
    if (!target) throw new Error("Machine not found");

    const payload: any = {};
    if (machine.name) payload.machineName = machine.name;
    if (machine.department) payload.departmentId = DEPT_MAP[machine.department] || target.departmentId;
    if (machine.type) payload.machineTypeId = MACHINE_TYPE_MAP[machine.type] || target.machineTypeId;

    const { data } = await apiClient.put<{ success: boolean; data: MachineAPIResponse }>(`/machines/${target.id}`, payload);
    return data.data;
  },

  async deleteMachine(id: string) {
    const { data: searchData } = await apiClient.get<{ success: boolean; data: { data: MachineAPIResponse[] } }>(`/machines?machineCode=${id}`);
    const target = searchData.data.data.find(m => m.machineCode === id);
    if (!target) throw new Error("Machine not found");

    const { data } = await apiClient.patch<{ success: boolean; data: MachineAPIResponse }>(`/machines/${target.id}/status`, {
      status: 'INACTIVE'
    });
    return data.data;
  },

  async assignRoom(id: number, assignmentData: { roomId: number | null, rowIndex: number | null, positionIndex: number | null }) {
    const { data } = await apiClient.post<{ success: boolean; data: MachineAPIResponse }>(`/machines/${id}/assign-room`, assignmentData);
    return data.data;
  }
};
