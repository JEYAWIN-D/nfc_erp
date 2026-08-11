import { Plus, Download } from "lucide-react";
import { useQCStore } from "../store/qc.store";

export function QCHeader() {
  const store = useQCStore();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-6 py-4 bg-zinc-950 border-b border-white/[0.05] flex-shrink-0">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Quality Control</h1>
        <p className="text-sm text-white/50 mt-1">Manage inspections, track defects, and monitor quality.</p>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-md border border-white/10 transition-colors">
          <Download className="w-4 h-4 text-white/60" /> Export
        </button>
      </div>
    </div>
  );
}
