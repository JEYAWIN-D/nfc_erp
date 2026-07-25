import { z } from "zod";

// Shared Enums
export type WorkerStatus = "active" | "inactive" | "on_leave" | "terminated";
export type WorkerGrade = "A" | "B" | "C" | "D";
export type WorkerShift = "Morning" | "Evening" | "Night";

// Zod Schema for the Add Worker Form Validation
export const workerFormSchema = z.object({
  employeeCode: z.string().min(3, "Employee code must be at least 3 characters").max(20),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  department: z.string().min(2, "Department is required"),
  grade: z.enum(["A", "B", "C", "D"]),
  primarySkill: z.string().min(2, "Primary skill is required"),
  secondarySkills: z.array(z.string()).optional(),
  shift: z.enum(["Morning", "Evening", "Night"]),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  nfcCardId: z.string().optional(),
  joiningDate: z.date(),
  status: z.enum(["active", "inactive", "on_leave", "terminated"]).default("active"),
  notes: z.string().optional(),
});

export type WorkerFormData = z.infer<typeof workerFormSchema>;

// Types for the UI Table and Drawer
export interface WorkerProfile extends WorkerFormData {
  id: string;
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkerAttendance {
  date: string;
  status: "present" | "absent" | "late" | "half_day";
  checkIn?: string;
  checkOut?: string;
  workingHours?: number;
}

export interface WorkerAssignment {
  machineId: string;
  operation: string;
  project?: string;
  productionOrder?: string;
  department?: string;
  assignedAt: Date;
  status: "active" | "completed";
}

export interface WorkerProduction {
  date: string;
  target: number;
  completed: number;
  efficiency: number;
}

export interface WorkerTimelineEvent {
  id: string;
  timestamp: Date;
  type: "attendance" | "assignment" | "production" | "qc" | "system";
  description: string;
  metadata?: Record<string, any>;
}

export interface WorkerHistoryItem {
  id: string;
  date: string;
  operationName: string;
  productionOrder?: string;
  projectName?: string;
  machineCode?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
}

export interface WorkerData extends WorkerProfile {
  attendanceRecords: WorkerAttendance[];
  currentAssignment?: WorkerAssignment & {
    checkInTime?: string;
    checkOutTime?: string;
    attendanceState?: 'present' | 'checked_out' | 'assigned_not_present';
  };
  productionHistory: WorkerProduction[];
  timeline: WorkerTimelineEvent[];
  history?: WorkerHistoryItem[];
  todayCheckIn?: string;
  todayCheckOut?: string;
}

// API Types based on Prisma Schema
export interface WorkerAPI {
  id: number;
  employeeCode: string;
  nfcCardId: string;
  firstName: string;
  lastName: string;
  gender?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  joiningDate?: string;
  departmentId: number;
  gradeId: number;
  status: "ACTIVE" | "INACTIVE";
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations (optional depending on API response)
  department?: {
    id: number;
    name: string;
  };
  grade?: {
    id: number;
    name: string;
  };
  skills?: Array<{
    skill: {
      id: number;
      name: string;
    }
  }>;
}

export interface WorkerQueryParams {
  search?: string;
  status?: string;
  departmentId?: number;
  page?: number;
  limit?: number;
}

export interface WorkersResponse {
  success: boolean;
  data: WorkerAPI[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface CreateWorkerRequest {
  employeeCode: string;
  nfcCardId: string;
  firstName: string;
  lastName: string;
  gender?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  joiningDate?: string;
  departmentId: number;
  gradeId: number;
  status?: "ACTIVE" | "INACTIVE";
  remarks?: string;
  skillIds?: number[];
}

export type UpdateWorkerRequest = Partial<CreateWorkerRequest>;
