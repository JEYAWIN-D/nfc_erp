import { z } from 'zod';

export const CreateQCCheckSchema = z.object({
  bundleId: z.number().int().positive(),
  tagId: z.number().int().positive().optional(),
  qcPersonId: z.number().int().positive(),
  qcTier: z.enum(['LINE_QC', 'FINAL_QC']),
  operationId: z.number().int().positive().optional(),
  workerId: z.number().int().positive().optional(),
  status: z.enum(['PASS', 'FAIL', 'REWORK']),
  passQuantity: z.number().int().nonnegative().default(0),
  rejectQuantity: z.number().int().nonnegative().default(0),
  reworkQuantity: z.number().int().nonnegative().default(0),
  defectNotes: z.string().optional(),
  passQuantity: z.number().int().nonnegative().optional().default(0),
  rejectQuantity: z.number().int().nonnegative().optional().default(0),
  reworkQuantity: z.number().int().nonnegative().optional().default(0),
});

export type CreateQCCheckDTO = z.infer<typeof CreateQCCheckSchema>;
