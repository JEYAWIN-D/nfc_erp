export interface QCCheckLog {
  id: number;
  bundleId: number;
  tagId?: number;
  qcPersonId: number;
  qcTier: 'LINE_QC' | 'FINAL_QC';
  operationId?: number;
  workerId?: number;
  status: 'PASS' | 'FAIL' | 'REWORK';
  passQuantity: number;
  rejectQuantity: number;
  reworkQuantity: number;
  defectNotes?: string;
  checkedAt: string;
  bundle?: any;
  tag?: any;
  qcPerson?: any;
  operation?: any;
  worker?: any;
}

export type QCResult = "Pass" | "Fail" | "Rework" | "Pending";

export interface QCInspection {
  id: string;
  inspectionId: string;
  bundleNumber: string;
  productionOrder: string;
  worker: string;
  machine: string;
  department: string;
  operation: string;
  inspector: string;
  result: QCResult;
  defectCount: number;
  remarks?: string;
  images: string[];
  date: string;
  timeline: { id: string; timestamp: string; action: string; actor: string }[];
}

export interface QCFormValues {
  bundleNumber: string;
  operation: string;
  inspector: string;
  result: QCResult;
  defectCount: number;
  remarks?: string;
}

export interface QCQueryParams {
  bundleId?: number;
  qcTier?: 'LINE_QC' | 'FINAL_QC';
  status?: 'PASS' | 'FAIL' | 'REWORK';
}
