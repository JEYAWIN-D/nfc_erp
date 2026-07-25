import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ProtectedRoute, GuestRoute } from "./guards";

// Auth
import LoginPage from "@/features/settings/LoginPage";

import LiveFactoryPage from "@/features/factory/LiveFactoryPage";

// Terminals (Standalone fullscreen apps)
import IotTerminalPage from "@/features/iot/IotTerminalPage";
import IotDemoPage from "@/features/iot/IotDemoPage";
import ModularIotDemoPage from "@/features/iot-demo/IotDemoPage";
import QCTerminalPage from "@/features/qc/QCTerminalPage";

// Worker
import WorkersPage from "@/features/worker/WorkersPage";

// Department
import { DepartmentManagement } from "@/features/department/components/DepartmentManagement";

// Machine
import MachinesPage from "@/features/machine/MachinesPage";
import MachineTypesPage from "@/features/machine/MachineTypesPage";
import TerminalsPage from "@/features/machine/TerminalsPage";

// Operations
import OperationsPage from "@/features/operation/OperationsPage";

// Shifts
import ShiftsPage from "@/features/shift/ShiftsPage";

// Attendance
import AttendancePage from "@/features/attendance/AttendancePage";

// Assignment
import AssignmentsPage from "@/features/assignment/AssignmentsPage";

// Production
import ProductionOrderPage from "@/features/production-order/ProductionOrderPage";
import BundlePage from "@/features/bundle/BundlePage";
import BundleTransactionPage from "@/features/bundle-transaction/BundleTransactionPage";

// QC
import QCPage from "@/features/qc/QCPage";

// Tag & QC Workflow
import TagWorkflowPage from "@/features/tag-workflow/TagWorkflowPage";

// Reports
import ReportsPage from "@/features/reports/ReportsPage";

// Planning
import PlanningBoardPage from "@/features/planning/PlanningBoardPage";
import PlanningCenterPage from "@/features/planning/PlanningCenterPage"; // New unified UI

// Settings
import { GeneralSettingsTab } from "../features/settings/components/tabs/GeneralSettingsTab";
import FactoryLayoutPage from "../features/factory-layout/FactoryLayoutPage";
import SettingsPage from "@/features/settings/SettingsPage";
import UserManagementPage from "@/features/user-management/UserManagementPage";

// Errors
import { NotFoundPage, ServerErrorPage, UnauthorizedPage } from "@/shared/components/ErrorPages";

export function AppRouter() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/planning/center" replace />} />

      {/* Auth routes (guests only) */}
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      {/* Protected app routes */}
      <Route element={<ProtectedRoute />}>
        {/* Fullscreen Terminals */}
        <Route path="/terminal/iot" element={<IotTerminalPage />} />
        <Route path="/terminal/iot-demo" element={<IotDemoPage />} />
        <Route path="/terminal/qc" element={<QCTerminalPage />} />

        <Route element={<DashboardLayout />}>
          <Route path="/planning/center" element={<PlanningCenterPage />} />
          <Route path="/planning/board" element={<PlanningBoardPage />} />
          <Route path="/live-factory" element={<LiveFactoryPage />} />
          <Route path="/iot-demo" element={<ModularIotDemoPage />} />
          <Route path="/factory-layout" element={<Navigate to="/live-factory" replace />} />
          <Route path="/departments" element={<DepartmentManagement />} />
          <Route path="/workers" element={<WorkersPage />} />
          <Route path="/machines" element={<MachinesPage />} />
          <Route path="/machine-types" element={<MachineTypesPage />} />
          <Route path="/terminals" element={<TerminalsPage />} />
          <Route path="/operations" element={<OperationsPage />} />
          <Route path="/shifts" element={<ShiftsPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/production-orders" element={<ProductionOrderPage />} />
          <Route path="/bundles" element={<BundlePage />} />
          <Route path="/bundle-transactions" element={<BundleTransactionPage />} />
          <Route path="/qc" element={<QCPage />} />
          <Route path="/tag-workflow" element={<TagWorkflowPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/500" element={<ServerErrorPage />} />
          <Route path="/401" element={<UnauthorizedPage />} />
        </Route>
      </Route>

      {/* 404 catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
