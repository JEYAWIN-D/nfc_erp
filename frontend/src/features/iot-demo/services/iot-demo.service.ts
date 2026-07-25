import api from '@/services/axios';
import type {
  ToggleWorkerResponse,
  ToggleMachineResponse,
  AdvanceBundleResponse,
  DemoActivityLog,
  OrderWorkflowContext,
} from '../types/iot-demo.types';

export const iotDemoApiService = {
  async getContext(orderId?: number): Promise<OrderWorkflowContext> {
    const res = await api.get('/iot/demo/context', {
      params: orderId ? { orderId } : undefined,
    });
    return res.data.data;
  },

  async toggleWorker(workerId: number): Promise<ToggleWorkerResponse> {
    const res = await api.post('/iot/demo/worker/toggle', { workerId });
    return res.data.data;
  },

  async toggleMachine(machineId: number, targetStatus?: string): Promise<ToggleMachineResponse> {
    const res = await api.post('/iot/demo/machine/toggle', { machineId, targetStatus });
    return res.data.data;
  },

  async advanceBundle(bundleId: number, workerId?: number): Promise<AdvanceBundleResponse> {
    const res = await api.post('/iot/demo/bundle/advance', { bundleId, workerId });
    return res.data.data;
  },

  async resetDemo(productionOrderId?: number): Promise<{ success: boolean; message: string }> {
    const res = await api.post('/iot/demo/reset', { productionOrderId });
    return res.data.data;
  },

  async getLogs(): Promise<DemoActivityLog[]> {
    const res = await api.get('/iot/demo/logs');
    return res.data.data || [];
  },
};
