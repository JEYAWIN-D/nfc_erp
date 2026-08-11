import { create } from "zustand";

export type ReportCategory = 
  | "Factory Overview"
  | "Production" 
  | "Worker Performance" 
  | "Machine Utilization" 
  | "Attendance" 
  | "QC" 
  | "Bundle" 
  | "Downtime" 
  | "Shift";

interface ReportsStore {
  activeCategory: ReportCategory;
  
  dateFilter: string;
  departmentFilter: string;
  shiftFilter: string;
  workerFilter: string;
  machineFilter: string;
  operationFilter: string;

  setActiveCategory: (cat: ReportCategory) => void;
  setDateFilter: (v: string) => void;
  setDepartmentFilter: (v: string) => void;
  setShiftFilter: (v: string) => void;
  setWorkerFilter: (v: string) => void;
  setMachineFilter: (v: string) => void;
  setOperationFilter: (v: string) => void;
  resetFilters: () => void;
}

const FILTER_DEFAULTS = {
  dateFilter: "today",
  departmentFilter: "all",
  shiftFilter: "all",
  workerFilter: "all",
  machineFilter: "all",
  operationFilter: "all",
};

export const useReportsStore = create<ReportsStore>((set) => ({
  activeCategory: "Production",
  
  ...FILTER_DEFAULTS,

  setActiveCategory: (cat) => set({ activeCategory: cat }),
  
  setDateFilter: (v) => set({ dateFilter: v }),
  setDepartmentFilter: (v) => set({ departmentFilter: v }),
  setShiftFilter: (v) => set({ shiftFilter: v }),
  setWorkerFilter: (v) => set({ workerFilter: v }),
  setMachineFilter: (v) => set({ machineFilter: v }),
  setOperationFilter: (v) => set({ operationFilter: v }),
  
  resetFilters: () => set(FILTER_DEFAULTS),
}));
