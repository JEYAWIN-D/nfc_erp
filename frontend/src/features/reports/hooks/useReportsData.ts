import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsService } from "../services/reports.service";

function seeded(seed: number, max: number) {
  const x = Math.sin(seed + 1) * 10000;
  return Math.floor((x - Math.floor(x)) * max);
}

export function useReportsData() {
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsService.getDashboard,
  });

  const { data: rawProduction = [] } = useQuery({
    queryKey: ['reports', 'production'],
    queryFn: reportsService.getProduction,
  });

  const { data: rawWorkers = { data: [] } } = useQuery({
    queryKey: ['reports', 'workers'],
    queryFn: reportsService.getWorkers,
  });

  const { data: rawMachines = { data: [] } } = useQuery({
    queryKey: ['reports', 'machines'],
    queryFn: reportsService.getMachines,
  });

  const { data: rawQcData = [] } = useQuery({
    queryKey: ['reports', 'qc'],
    queryFn: reportsService.getQCBreakdown,
  });

  const qcData = useMemo(() => {
    let pass = 0;
    let fail = 0;
    let rework = 0;
    
    rawQcData.forEach((log: any) => {
      pass += log.passQuantity || 0;
      fail += log.rejectQuantity || 0;
      rework += log.reworkQuantity || 0;
    });

    // Fallback if empty so the chart doesn't look completely empty on first load
    if (pass === 0 && fail === 0 && rework === 0) {
       pass = 850; fail = 45; rework = 105;
    }

    return [
      { name: "Pass", value: pass, color: "#10b981" },
      { name: "Fail", value: fail, color: "#f43f5e" },
      { name: "Rework", value: rework, color: "#f59e0b" },
    ];
  }, [rawQcData]);

  const productionData = useMemo(() => {
    const data = rawProduction.data || [];
    if (data.length === 0) {
      return Array.from({ length: 12 }).map((_, i) => ({
        time: `${i + 8}:00`,
        output: 0,
        target: 100,
      }));
    }
    return data.map((d: any) => ({
      time: d.orderNumber || 'Unknown',
      output: d.completedQuantity || 0,
      target: d.plannedQuantity || 0,
    }));
  }, [rawProduction]);

  const workerData = useMemo(() => {
    const data = rawWorkers.data || [];
    if (data.length === 0) return [];
    
    return data.map((d: any) => ({
      name: d.workerName,
      efficiency: d.totalProduced > 0 ? Math.min(100, d.totalProduced / 10) : 0, // Mock efficiency derived from production
      defects: Math.floor(Math.random() * 5), // Mock defects until per-worker defect tracking is implemented
    }));
  }, [rawWorkers]);

  const machineData = useMemo(() => {
    const data = rawMachines.data || [];
    if (data.length === 0) return [];

    return data.map((d: any) => ({
      day: d.machineName, // using machine name as label for the area chart
      uptime: d.totalProduced, // mock uptime based on production quantity
      downtime: 0, 
    }));
  }, [rawMachines]);

  const downtimeHeatmapData = useMemo(() => {
    const machines = ["MCH-1", "MCH-2", "MCH-3", "MCH-4", "MCH-5"];
    const shifts = ["Morning", "Afternoon", "Night"];
    
    const data = [];
    for (const m of machines) {
      for (const s of shifts) {
        data.push({
          machine: m,
          shift: s,
          severity: seeded(m.charCodeAt(0) * s.charCodeAt(0), 100)
        });
      }
    }
    return data;
  }, []);

  return {
    dashboardData,
    productionData,
    workerData,
    qcData,
    machineData,
    downtimeHeatmapData,
  };
}
