import { z } from "zod";

export const shiftSchema = z.object({
  id: z.string().optional(),
  shiftCode: z.string().min(2, "Code is required"),
  shiftName: z.string().min(3, "Name is required"),
  startTime: z.string().min(5, "Start time is required"),
  endTime: z.string().min(5, "End time is required"),
  breakDuration: z.number().min(0, "Break duration cannot be negative"),
  supervisor: z.string().min(3, "Supervisor is required"),
  status: z.enum(["active", "upcoming", "completed"]),
  assignedWorkers: z.number().default(0),
  assignedMachines: z.number().default(0),
  productionTarget: z.number().default(0),
  productionCompleted: z.number().default(0),
  attendanceCount: z.number().default(0),
});

export type Shift = z.infer<typeof shiftSchema> & {
  assignments?: any[];
};

export interface ShiftKPIs {
  totalShifts: number;
  activeShift: string;
  workersPresent: number;
  runningMachines: number;
  attendancePercentage: number;
  productionToday: number;
}
