import { iotDemoApiService } from '../services/iot-demo.service';
import type { IIoTProviderStrategy, HardwareMode } from '../types/iot-demo.types';

export class DemoHardwareStrategy implements IIoTProviderStrategy {
  modeName: HardwareMode = 'SIMULATOR';

  async getContext(orderId?: number) {
    return iotDemoApiService.getContext(orderId);
  }

  async toggleWorker(workerId: number) {
    return iotDemoApiService.toggleWorker(workerId);
  }

  async toggleMachine(machineId: number, targetStatus?: string) {
    return iotDemoApiService.toggleMachine(machineId, targetStatus);
  }

  async advanceBundle(bundleId: number, workerId?: number) {
    return iotDemoApiService.advanceBundle(bundleId, workerId);
  }

  async resetDemo(productionOrderId?: number) {
    return iotDemoApiService.resetDemo(productionOrderId);
  }

  async getLogs() {
    return iotDemoApiService.getLogs();
  }
}

export const demoHardwareStrategy = new DemoHardwareStrategy();
