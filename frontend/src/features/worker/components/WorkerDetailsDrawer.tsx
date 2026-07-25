import * as React from 'react';
import { useWorkerStore } from '../store/worker.store';
import { useWorker } from '../hooks/useWorker';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { User, Wrench, Package, Clock, Loader2 } from 'lucide-react';

export function WorkerDetailsDrawer() {
  const store = useWorkerStore();
  const { data: worker, isLoading } = useWorker(store.selectedWorkerId);

  const [activeTab, setActiveTab] = React.useState('profile');

  if (!store.isDrawerOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md lg:max-w-xl bg-zinc-950 border-l border-white/10 p-0 text-white overflow-hidden flex flex-col shadow-2xl">
      {isLoading || !worker ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-white/50">Loading worker details...</p>
        </div>
      ) : (
        <>
          {/* Header section with photo */}
          <div className="bg-zinc-900/50 p-6 border-b border-white/10 flex-shrink-0 flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center font-bold text-2xl text-blue-400">
                {worker.firstName[0]}{worker.lastName[0]}
              </div>
              <div>
                <div className="text-xl font-bold text-white">
                  {worker.firstName} {worker.lastName}
                </div>
                <p className="text-sm text-white/50">{worker.employeeCode} • {worker.department}</p>
                
                <div className="flex gap-2 mt-3">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Grade {worker.grade}</Badge>
                  <Badge variant="outline" className="text-white/60 border-white/10">{worker.primarySkill}</Badge>
                  <Badge className={worker.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-none" : "bg-amber-500/10 text-amber-400 border-none"}>
                    {worker.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
            <button onClick={() => store.setDrawerOpen(false)} className="text-white/40 hover:text-white p-2">✕</button>
          </div>

      {/* Tabs section */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-6 border-b border-white/10 flex-shrink-0">
          <div className="flex bg-transparent h-12 w-full justify-start overflow-x-auto hide-scrollbar gap-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={cn(
                "flex items-center px-3 h-12 text-sm font-medium border-b-2 gap-2 transition-colors cursor-pointer",
                activeTab === 'profile' ? "border-blue-500 text-white" : "border-transparent text-white/50 hover:text-white"
              )}
            >
              <User className="w-4 h-4" /> Profile
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={cn(
                "flex items-center px-3 h-12 text-sm font-medium border-b-2 gap-2 transition-colors cursor-pointer",
                activeTab === 'attendance' ? "border-blue-500 text-white" : "border-transparent text-white/50 hover:text-white"
              )}
            >
              <Clock className="w-4 h-4" /> Attendance
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={cn(
                "flex items-center px-3 h-12 text-sm font-medium border-b-2 gap-2 transition-colors cursor-pointer",
                activeTab === 'assignments' ? "border-blue-500 text-white" : "border-transparent text-white/50 hover:text-white"
              )}
            >
              <Wrench className="w-4 h-4" /> Assignment
            </button>
            <button
              onClick={() => setActiveTab('production')}
              className={cn(
                "flex items-center px-3 h-12 text-sm font-medium border-b-2 gap-2 transition-colors cursor-pointer",
                activeTab === 'production' ? "border-blue-500 text-white" : "border-transparent text-white/50 hover:text-white"
              )}
            >
              <Package className="w-4 h-4" /> Production
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'profile' && (
            <div className="grid grid-cols-2 gap-4">
              <ProfileField label="Employee ID" value={worker.employeeCode} />
              <ProfileField label="NFC Card ID" value={worker.nfcCardId || "Not assigned"} />
              <ProfileField label="Department" value={worker.department} />
              <ProfileField label="Primary Skill" value={worker.primarySkill} />
              <ProfileField label="Avg Bundle Speed" value={worker.avgMinutesPerBundle ? `${worker.avgMinutesPerBundle} mins / batch` : "14.5 mins / batch"} />
              <ProfileField label="Shift" value={worker.shift} />
              <ProfileField label="Email" value={worker.email || "N/A"} />
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6">
              {/* Today's Timestamps */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Work Start Time (Check-IN)</p>
                  <p className="text-lg font-bold font-mono text-emerald-300">
                    {worker.todayCheckIn ? new Date(worker.todayCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "Not Checked IN Today"}
                  </p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Work Ending Time (Check-OUT)</p>
                  <p className="text-lg font-bold font-mono text-amber-300">
                    {worker.todayCheckOut ? new Date(worker.todayCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "Not Checked OUT Today"}
                  </p>
                </div>
              </div>

              {/* Attendance Log History */}
              <div>
                <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3">Attendance Log History</h3>
                {worker.attendanceRecords && worker.attendanceRecords.length > 0 ? (
                  <div className="space-y-2">
                    {worker.attendanceRecords.map((rec, i) => (
                      <div key={i} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-white">{rec.date}</p>
                          <p className="text-white/40">{rec.checkIn ? `Check-IN: ${rec.checkIn}` : rec.checkOut ? `Check-OUT: ${rec.checkOut}` : 'Logged'}</p>
                        </div>
                        <Badge className={rec.checkIn ? "bg-emerald-500/10 text-emerald-400 border-none" : "bg-amber-500/10 text-amber-400 border-none"}>
                          {rec.checkIn ? 'Check-IN' : 'Check-OUT'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-white/50 text-sm text-center py-8">
                    <Clock className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No attendance logs recorded yet.
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'assignments' && (
            <div className="space-y-6">
              {/* Current Active Assignment */}
              {worker.currentAssignment ? (
                <div className="p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Current Active Assignment</h3>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-none text-[10px]">ACTIVE</Badge>
                  </div>
                  <p className="text-white font-bold text-base">Machine {worker.currentAssignment.machineId}</p>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-emerald-500/10 text-xs">
                    <div>
                      <span className="text-white/40 block">Operation</span>
                      <span className="text-white font-medium">{worker.currentAssignment.operation}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block">Order / Project</span>
                      <span className="text-white font-medium">{worker.currentAssignment.productionOrder || 'N/A'} ({worker.currentAssignment.project})</span>
                    </div>
                    <div>
                      <span className="text-white/40 block mt-2">Work Start Time</span>
                      <span className="text-emerald-400 font-mono font-semibold">
                        {worker.currentAssignment.checkInTime ? new Date(worker.currentAssignment.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not Checked IN'}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block mt-2">Work Ending Time</span>
                      <span className="text-amber-400 font-mono font-semibold">
                        {worker.currentAssignment.checkOutTime ? new Date(worker.currentAssignment.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-white/50 text-sm bg-white/[0.02] border border-white/[0.05] rounded-xl">
                  <Wrench className="w-6 h-6 mx-auto mb-2 opacity-30" />
                  No active machine assignment.
                </div>
              )}

              {/* Worker Daily Work History */}
              <div>
                <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3">Daily Operations & Task History</h3>
                {worker.history && worker.history.length > 0 ? (
                  <div className="space-y-2.5">
                    {worker.history.map((item) => (
                      <div key={item.id} className="p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{item.operationName}</span>
                          <span className="text-white/40 text-[10px] font-mono">{item.date}</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/60">
                          <span>Order: <strong className="text-white">{item.productionOrder}</strong></span>
                          <span>·</span>
                          <span>Machine: <strong className="text-blue-400 font-mono">{item.machineCode}</strong></span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-1 text-white/40 border-t border-white/5">
                          <span>Start: <strong className="text-emerald-400 font-mono">{item.startTime || '—'}</strong></span>
                          <span>End: <strong className="text-amber-400 font-mono">{item.endTime || 'In Progress'}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-white/40 text-xs text-center py-6 italic">No previous work history recorded.</div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'production' && (
            <div className="text-white/50 text-sm text-center py-12">
              <Package className="w-8 h-8 mx-auto mb-3 opacity-20" />
              Daily production targets and completed pieces will appear here.
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-lg">
      <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}
