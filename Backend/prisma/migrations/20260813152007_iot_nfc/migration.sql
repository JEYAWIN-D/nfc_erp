/*
  Warnings:

  - The values [QC_PENDING] on the enum `BundleStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [QC,TRANSFERRED] on the enum `TaskStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `bundle_transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `qc_inspections` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[roomId,rowIndex,positionIndex]` on the table `machines` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BundleStatus_new" AS ENUM ('CREATED', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'QC_COMPLETED', 'REWORK', 'HOLD');
ALTER TABLE "public"."bundles" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "bundles" ALTER COLUMN "status" TYPE "BundleStatus_new" USING ("status"::text::"BundleStatus_new");
ALTER TYPE "BundleStatus" RENAME TO "BundleStatus_old";
ALTER TYPE "BundleStatus_new" RENAME TO "BundleStatus";
DROP TYPE "public"."BundleStatus_old";
ALTER TABLE "bundles" ALTER COLUMN "status" SET DEFAULT 'CREATED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TaskStatus_new" AS ENUM ('CREATED', 'PLANNED', 'ASSIGNED', 'ACCEPTED', 'RUNNING', 'COMPLETED', 'CLOSED');
ALTER TABLE "public"."production_tasks" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "production_tasks" ALTER COLUMN "status" TYPE "TaskStatus_new" USING ("status"::text::"TaskStatus_new");
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "public"."TaskStatus_old";
ALTER TABLE "production_tasks" ALTER COLUMN "status" SET DEFAULT 'CREATED';
COMMIT;

-- DropForeignKey
ALTER TABLE "bundle_transactions" DROP CONSTRAINT "bundle_transactions_bundleId_fkey";

-- DropForeignKey
ALTER TABLE "bundle_transactions" DROP CONSTRAINT "bundle_transactions_fromMachineId_fkey";

-- DropForeignKey
ALTER TABLE "bundle_transactions" DROP CONSTRAINT "bundle_transactions_fromOperationId_fkey";

-- DropForeignKey
ALTER TABLE "bundle_transactions" DROP CONSTRAINT "bundle_transactions_fromWorkerId_fkey";

-- DropForeignKey
ALTER TABLE "bundle_transactions" DROP CONSTRAINT "bundle_transactions_productionOrderId_fkey";

-- DropForeignKey
ALTER TABLE "bundle_transactions" DROP CONSTRAINT "bundle_transactions_toMachineId_fkey";

-- DropForeignKey
ALTER TABLE "bundle_transactions" DROP CONSTRAINT "bundle_transactions_toOperationId_fkey";

-- DropForeignKey
ALTER TABLE "bundle_transactions" DROP CONSTRAINT "bundle_transactions_toWorkerId_fkey";

-- DropForeignKey
ALTER TABLE "qc_inspections" DROP CONSTRAINT "qc_inspections_bundleId_fkey";

-- DropForeignKey
ALTER TABLE "qc_inspections" DROP CONSTRAINT "qc_inspections_machineId_fkey";

-- DropForeignKey
ALTER TABLE "qc_inspections" DROP CONSTRAINT "qc_inspections_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "qc_inspections" DROP CONSTRAINT "qc_inspections_workerId_fkey";

-- AlterTable
ALTER TABLE "qc_check_logs" ADD COLUMN     "passQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rejectQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reworkQuantity" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "bundle_transactions";

-- DropTable
DROP TABLE "qc_inspections";

-- CreateTable
CREATE TABLE "status_reason_codes" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "appliesToStatus" TEXT NOT NULL DEFAULT 'Any',
    "iconName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_reason_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_status_events" (
    "id" SERIAL NOT NULL,
    "machineId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "reasonCodeId" INTEGER,
    "note" TEXT,
    "reportedBy" INTEGER,
    "isSystemGenerated" BOOLEAN NOT NULL DEFAULT false,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "machine_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "status_reason_codes_code_key" ON "status_reason_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "machines_roomId_rowIndex_positionIndex_key" ON "machines"("roomId", "rowIndex", "positionIndex");

-- AddForeignKey
ALTER TABLE "machine_status_events" ADD CONSTRAINT "machine_status_events_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_status_events" ADD CONSTRAINT "machine_status_events_reasonCodeId_fkey" FOREIGN KEY ("reasonCodeId") REFERENCES "status_reason_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
