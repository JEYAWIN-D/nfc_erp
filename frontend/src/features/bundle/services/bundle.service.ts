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
  };

  return {
    id: apiData.id.toString(),
    bundleNumber: apiData.bundleNumber,
    productionOrder: `PO-${apiData.productionOrderId}`,
    operation: apiData.currentOperation?.name || 'Unassigned',
    department: apiData.currentWorker?.department?.name || apiData.currentMachine?.department?.name || 'Unassigned',
    targetPieces: apiData.quantity,
    completedPieces: apiData.completedQuantity,
    defectivePieces: 0, // Mock fallback for UI
    currentWorker: apiData.currentWorker 
      ? `${apiData.currentWorker.firstName} ${apiData.currentWorker.lastName}` 
      : undefined,
    currentMachine: apiData.currentMachine?.machineName,
    priority: "medium" as BundlePriority, // Fallback for now
    status: statusMap[apiData.status] || "in_progress",
    startedTime: (apiData.stageLogs && apiData.stageLogs.length > 0) ? apiData.stageLogs[apiData.stageLogs.length - 1].inTime : apiData.createdAt,
    completedTime: apiData.status === 'COMPLETED' ? apiData.updatedAt : (apiData.stageLogs && apiData.stageLogs.length > 0 && apiData.stageLogs[apiData.stageLogs.length - 1].outTime) ? (apiData.stageLogs[apiData.stageLogs.length - 1].outTime ?? undefined) : undefined,
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
