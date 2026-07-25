export type HardwareMode = 'SIMULATOR' | 'HARDWARE_MQTT';

export interface DemoActivityLog {
  id: string;
  timestamp: string;
  category: 'ATTENDANCE' | 'MACHINE' | 'BUNDLE' | 'SYSTEM';
  eventType: string;
  message: string;
  details?: any;
}

export interface ToggleWorkerResponse {
  success: boolean;
  status: 'PRESENT' | 'ABSENT';
  workerName: string;
  machineAutoIdled: boolean;
  message: string;
}

export interface ToggleMachineResponse {
  success: boolean;
  machineId: number;
  machineCode: string;
  status: string;
  message: string;
}

export interface AdvanceBundleResponse {
  success: boolean;
  bundleId: number;
  bundleNumber: string;
  status: string;
  completedQuantity: number;
  totalQuantity: number;
  message: string;
}

export interface OrderWorkflowContext {
  orders: any[];
  selectedOrder: any | null;
  tasks: any[];
  operations: any[];
  bundles: any[];
  attendances?: any[];
  workerTimingStats?: Record<string, any>;
}

export interface IIoTProviderStrategy {
  modeName: HardwareMode;
  getContext(orderId?: number): Promise<OrderWorkflowContext>;
  toggleWorker(workerId: number): Promise<ToggleWorkerResponse>;
  toggleMachine(machineId: number, targetStatus?: string): Promise<ToggleMachineResponse>;
  advanceBundle(bundleId: number, workerId?: number): Promise<AdvanceBundleResponse>;
  resetDemo(productionOrderId?: number): Promise<{ success: boolean; message: string }>;
  getLogs(): Promise<DemoActivityLog[]>;
}
