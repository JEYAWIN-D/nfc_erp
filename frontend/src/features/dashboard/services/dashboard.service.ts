import apiClient from "@/services/axios";
import type { 
  DashboardOverviewResponse, 
  LiveMachineCard, 
  AttendanceTapRecord,
  DashboardExtendedResponse
} from "../types/dashboard.types";

export const dashboardService = {
  getOverview: async (startDate?: string, endDate?: string): Promise<DashboardOverviewResponse> => {
    const { data } = await apiClient.get<DashboardOverviewResponse>("/dashboard/overview", {
      params: { startDate, endDate }
    });
    return data;
  },

  getLiveFloor: async (): Promise<LiveMachineCard[]> => {
    const { data } = await apiClient.get<LiveMachineCard[]>("/dashboard/live-floor");
    return data;
  },

  getAttendanceSummary: async (): Promise<AttendanceTapRecord[]> => {
    const { data } = await apiClient.get<AttendanceTapRecord[]>("/dashboard/attendance");
    return data;
  },

  getExtendedFeatures: async (startDate?: string, endDate?: string): Promise<DashboardExtendedResponse> => {
    const { data } = await apiClient.get<DashboardExtendedResponse>("/dashboard/extended-features", {
      params: { startDate, endDate }
    });
    return data;
  },
};
export default dashboardService;
