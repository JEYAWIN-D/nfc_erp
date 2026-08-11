import { cn } from "@/lib/utils";
import { useReportsStore, type ReportCategory } from "../store/reports.store";
import { 
  BarChart3, 
  Users, 
  Settings, 
  UserCheck, 
  ShieldCheck, 
  Package, 
  AlertTriangle, 
  Clock 
} from "lucide-react";

const CATEGORIES: { id: ReportCategory; label: string; icon: any }[] = [
  { id: "Factory Overview" as ReportCategory, label: "Factory Overview", icon: BarChart3 },
  { id: "Production", label: "Production Report", icon: BarChart3 },
  { id: "Worker Performance", label: "Worker Performance", icon: Users },
  { id: "Machine Utilization", label: "Machine Utilization", icon: Settings },
  { id: "Attendance", label: "Attendance Report", icon: UserCheck },
  { id: "QC", label: "QC Report", icon: ShieldCheck },
  { id: "Bundle", label: "Bundle Report", icon: Package },
  { id: "Downtime", label: "Downtime Report", icon: AlertTriangle },
  { id: "Shift", label: "Shift Report", icon: Clock },
];

export function ReportsSidebar() {
  const store = useReportsStore();

  return (
    <div className="w-64 bg-zinc-950 border-r border-white/[0.05] flex-shrink-0 overflow-y-auto custom-scrollbar">
      <div className="p-4 space-y-1">
        <h3 className="px-2 text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Dashboards</h3>
        
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = store.activeCategory === cat.id;
          
          return (
            <button
              key={cat.id}
              onClick={() => store.setActiveCategory(cat.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" 
                  : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
