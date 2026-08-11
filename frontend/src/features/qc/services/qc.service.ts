import api from '@/services/axios';
import type { QCCheckLog, QCInspection, QCQueryParams } from '../types/qc.types';

function mapLogToInspection(log: QCCheckLog): QCInspection {
  return {
    id: log.id.toString(),
    inspectionId: `QC-${30000 + log.id}`,
    bundleNumber: log.bundle?.qrCode || `BND-${log.bundleId}`,
    productionOrder: log.bundle?.productionOrder?.code || 'Unknown PO',
    worker: log.worker?.name || 'Unknown Worker',
    machine: 'N/A', // Assuming no direct machine on QCCheckLog
    department: 'Stitching', // Hardcoded or extracted from operation
    operation: log.operation?.name || 'Unknown Operation',
    inspector: log.qcPerson?.name || 'System',
    result: log.status === 'PASS' ? 'Pass' : log.status === 'FAIL' ? 'Fail' : 'Rework',
    defectCount: log.rejectQuantity + log.reworkQuantity,
    remarks: log.defectNotes,
    images: [],
    date: log.checkedAt,
    timeline: [
      { id: `t_${log.id}`, timestamp: log.checkedAt, action: `Inspection ${log.status}`, actor: log.qcPerson?.name || 'System' }
    ]
  };
}

export const qcService = {
  getAll: async (params?: QCQueryParams): Promise<QCInspection[]> => {
    const response = await api.get('/qc-checks', { params });
    const data: QCCheckLog[] = response.data?.data || response.data || [];
    return data.map(mapLogToInspection);
  },
  getById: async (id: number): Promise<QCInspection> => {
    const response = await api.get(`/qc-checks/${id}`);
    const data: QCCheckLog = response.data?.data || response.data;
    return mapLogToInspection(data);
  }
};
