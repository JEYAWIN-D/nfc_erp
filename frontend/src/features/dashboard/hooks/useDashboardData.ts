import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard.service";

export function useDashboardOverview(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["dashboard", "overview", startDate, endDate],
    queryFn: () => dashboardService.getOverview(startDate, endDate),
    refetchInterval: 15000, // Refetch overview metrics every 15 seconds
  });
}

export function useLiveFloorData() {
  return useQuery({
    queryKey: ["dashboard", "live-floor"],
    queryFn: () => dashboardService.getLiveFloor(),
    refetchInterval: 5000, // Refetch live machines list every 5 seconds for real-time feel
  });
}

export function useDashboardAttendance() {
  return useQuery({
    queryKey: ["dashboard", "attendance"],
    queryFn: () => dashboardService.getAttendanceSummary(),
    refetchInterval: 10000, // Refetch attendance updates every 10 seconds
  });
}

export function useDashboardExtended(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["dashboard", "extended-features", startDate, endDate],
    queryFn: () => dashboardService.getExtendedFeatures(startDate, endDate),
    refetchInterval: 10000, // Refetch extended widgets data every 10 seconds
  });
}
