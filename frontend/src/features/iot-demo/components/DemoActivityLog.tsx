import React from 'react';
import { Activity, Clock, CheckCircle2, Cpu, Layers, RefreshCcw, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useIotDemoStore } from '../store/iot-demo.store';
import type { DemoActivityLog as ActivityLogEntry } from '../types/iot-demo.types';

export function DemoActivityLog() {
  const { logs, logFilter, setLogFilter } = useIotDemoStore();

  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'all') return true;
    return log.category.toLowerCase() === logFilter.toLowerCase();
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ATTENDANCE':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'MACHINE':
        return <Cpu className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'BUNDLE':
        return <Layers className="w-3.5 h-3.5 text-violet-400 shrink-0" />;
      default:
        return <RefreshCcw className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'ATTENDANCE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'MACHINE':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'BUNDLE':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/60 border border-white/8 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between gap-3 bg-zinc-900/80">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Activity Log</h3>
        </div>
        <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono font-bold">
          {logs.length} events
        </span>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="w-8 h-8 text-white/10 mb-2" />
            <p className="text-xs text-white/40 font-medium">No activity logged yet</p>
            <p className="text-[10px] text-white/20 max-w-xs mt-1">
              Click any Worker, Machine, or Bundle to generate real-time simulation events
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const timeStr = log.timestamp ? format(new Date(log.timestamp), 'HH:mm:ss') : '--:--:--';
            return (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-zinc-950/60 border border-white/5 flex items-start gap-3 hover:border-white/10 transition-colors"
              >
                {getCategoryIcon(log.category)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider',
                        getCategoryBadge(log.category)
                      )}
                    >
                      {log.category}
                    </span>
                    <span className="text-[10px] font-mono text-white/30">{log.eventType}</span>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed font-sans">{log.message}</p>
                </div>

                <span className="text-[10px] font-mono text-white/30 shrink-0 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {timeStr}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
