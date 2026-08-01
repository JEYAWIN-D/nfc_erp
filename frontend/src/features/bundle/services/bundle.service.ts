import apiClient from '@/services/axios';
import type {
  BundleAPI,
  ApiResponse,
  BundlesResponse,
  CreateBundleRequest,
  UpdateBundleRequest,
  BundleQueryParams,
  Bundle,
  BundleStatus,
  BundlePriority
} from '../types/bundle.types';

const BASE = '/bundles';

export const mapBundleAPIToUI = (apiData: BundleAPI): Bundle => {
  const statusMap: Record<string, BundleStatus> = {
    CREATED: "in_progress",
    IN_PROGRESS: "in_progress",
    WAITING: "delayed",
    COMPLETED: "completed",
    QC_COMPLETED: "completed",
    REWORK: "rework",
    HOLD: "on_hold",
  };

  const orderNo = apiData.productionOrder?.orderNumber || (apiData.productionOrderId ? `PO-${apiData.productionOrderId}` : 'Unassigned Order');
  const customer = apiData.productionOrder?.buyerName || '';
  const style = apiData.productionOrder?.styleNumber || apiData.productionOrder?.styleName || '';

  const machineLabel = apiData.currentMachine?.machineCode
    ? `${apiData.currentMachine.machineCode}`
    : apiData.currentMachine?.machineName;

  // Resolve operation name
  let operationName = apiData.currentOperation?.operationName || apiData.currentOperation?.name;
  if (!operationName && apiData.stageLogs && apiData.stageLogs.length > 0) {
    const lastLog = apiData.stageLogs[apiData.stageLogs.length - 1];
    operationName = lastLog.operation?.operationName || lastLog.operation?.name;
  }
  if (!operationName) {
    operationName = 'Unassigned';
  }

  // Resolve worker name
  let workerName = apiData.currentWorker 
    ? `${apiData.currentWorker.firstName} ${apiData.currentWorker.lastName}` 
    : undefined;
  if (!workerName && apiData.stageLogs && apiData.stageLogs.length > 0) {
    const lastLog = apiData.stageLogs[apiData.stageLogs.length - 1];
    if (lastLog.operator) {
      workerName = `${lastLog.operator.firstName} ${lastLog.operator.lastName}`;
    }
  }

  return {
    id: apiData.id.toString(),
    bundleNumber: apiData.bundleNumber,
    productionOrder: orderNo,
    orderNumber: orderNo,
    customerName: customer,
    styleNumber: style,
    operation: operationName,
    department: apiData.currentWorker?.department?.name || apiData.currentMachine?.department?.name || 'Unassigned',
    targetPieces: apiData.quantity,
    completedPieces: apiData.completedQuantity,
    defectivePieces: 0, // Mock fallback for UI
    currentWorker: workerName,
    currentMachine: machineLabel,
    priority: "medium" as BundlePriority, // Fallback for now
    status: statusMap[apiData.status] || "in_progress",
    startedTime: (apiData.stageLogs && apiData.stageLogs.length > 0) ? apiData.stageLogs[0].inTime : apiData.createdAt,
    completedTime: (apiData.status === 'COMPLETED' || apiData.status === 'QC_COMPLETED') ? apiData.updatedAt : (apiData.stageLogs && apiData.stageLogs.length > 0 && apiData.stageLogs[apiData.stageLogs.length - 1].outTime) ? (apiData.stageLogs[apiData.stageLogs.length - 1].outTime ?? undefined) : undefined,
    timeline: [],
    
    // Simulator helpers
    activeTagCode: apiData.tagAssignments?.[0]?.tagCode,
    activeTerminalCode: (apiData.currentMachine as any)?.terminal?.terminalCode,
    activeWorkerCardId: apiData.currentWorker?.nfcCardId
  };
};

export const bundleService = {
  async getAll(params?: BundleQueryParams): Promise<Bundle[]> {
    const { data } = await apiClient.get<BundlesResponse>(BASE, { params });
    // Assuming backend returns an object with "data" property or an array
    const bundles = Array.isArray(data.data) ? data.data : (data as unknown as BundleAPI[]);
    return bundles.map(mapBundleAPIToUI);
  },

  async getById(id: number): Promise<Bundle> {
    const { data } = await apiClient.get<ApiResponse<BundleAPI>>(`${BASE}/${id}`);
    return mapBundleAPIToUI(data.data);
  },

  async create(payload: CreateBundleRequest): Promise<Bundle> {
    const { data } = await apiClient.post<ApiResponse<BundleAPI>>(BASE, payload);
    return mapBundleAPIToUI(data.data);
  },

  async update(id: number, payload: UpdateBundleRequest): Promise<Bundle> {
    const { data } = await apiClient.put<ApiResponse<BundleAPI>>(`${BASE}/${id}`, payload);
    return mapBundleAPIToUI(data.data);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`);
  },
};
