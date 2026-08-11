import { motion, AnimatePresence } from "framer-motion";
import { useReportsStore } from "../../store/reports.store";
import { useReportsData } from "../../hooks/useReportsData";

import { ProductionLineChart } from "../charts/ProductionLineChart";
import { WorkerBarChart } from "../charts/WorkerBarChart";
import { MachineAreaChart } from "../charts/MachineAreaChart";
import { QCPieChart } from "../charts/QCPieChart";
import { DowntimeHeatmap } from "../charts/DowntimeHeatmap";

export function DashboardView() {
  const store = useReportsStore();
  const data = useReportsData();

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-950 p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={store.activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6 max-w-7xl mx-auto"
        >
          {/* Header for View */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white">{store.activeCategory} Dashboard</h2>
          </div>

          {/* Dynamic Content Based on Active Category */}
          {store.activeCategory === "Factory Overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                <p className="text-white/50 text-sm mb-1">Total Workers</p>
                <p className="text-2xl font-bold text-white">{data.dashboardData?.workers?.total || '-'}</p>
                <p className="text-emerald-400 text-xs mt-2">{data.dashboardData?.workers?.present || '-'} Present</p>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                <p className="text-white/50 text-sm mb-1">Machines</p>
                <p className="text-2xl font-bold text-white">{data.dashboardData?.machines?.total || '-'}</p>
                <p className="text-emerald-400 text-xs mt-2">{data.dashboardData?.machines?.active || '-'} Active</p>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                <p className="text-white/50 text-sm mb-1">Production (Units)</p>
                <p className="text-2xl font-bold text-white">{data.dashboardData?.production?.completed || '-'}</p>
                <p className="text-emerald-400 text-xs mt-2">{data.dashboardData?.production?.efficiency || '-'}% Efficiency</p>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                <p className="text-white/50 text-sm mb-1">QC Pass Rate</p>
                <p className="text-2xl font-bold text-white">
                  {data.dashboardData?.qc ? 
                    Math.round((data.dashboardData.qc.pass / ((data.dashboardData.qc.pass + data.dashboardData.qc.reject) || 1)) * 100) 
                    : '-'}%
                </p>
                <p className="text-rose-400 text-xs mt-2">{data.dashboardData?.qc?.reject || '-'} Rejects</p>
              </div>
            </div>
          )}

          {store.activeCategory === "Production" && (
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-6">Hourly Output Trend vs Target</h3>
                <ProductionLineChart data={data.productionData} />
              </div>
            </div>
          )}

          {store.activeCategory === "Worker Performance" && (
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-6">Worker Efficiency & Defects</h3>
                <WorkerBarChart data={data.workerData} />
              </div>
            </div>
          )}

          {store.activeCategory === "Machine Utilization" && (
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-6">Aggregate Uptime vs Downtime</h3>
                <MachineAreaChart data={data.machineData} />
              </div>
            </div>
          )}

          {store.activeCategory === "QC" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 flex flex-col">
                <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-6">Defect Distribution</h3>
                <div className="flex-1 min-h-[300px]">
                  <QCPieChart data={data.qcData} />
                </div>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-6">Summary</h3>
                <div className="space-y-4">
                  {data.qcData.map((d: any) => (
                    <div key={d.name} className="flex justify-between items-center p-4 bg-zinc-950 rounded-lg border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                        <span className="text-white font-medium">{d.name}</span>
                      </div>
                      <span className="text-xl font-bold text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {store.activeCategory === "Downtime" && (
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-6">Downtime Severity Heatmap</h3>
                <DowntimeHeatmap data={data.downtimeHeatmapData} />
              </div>
            </div>
          )}

          {/* Fallback for other categories that don't have bespoke charts yet */}
          {["Attendance", "Bundle", "Shift"].includes(store.activeCategory) && (
            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{store.activeCategory} Data Available Soon</h3>
              <p className="text-sm text-white/40 max-w-md mx-auto">
                Detailed visualizations for {store.activeCategory.toLowerCase()} are currently being aggregated. Please check back later.
              </p>
            </div>
          )}
          
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
