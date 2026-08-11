import { Search, RotateCcw } from "lucide-react";
import { useQCStore } from "../store/qc.store";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQCs } from "../hooks/useQCs";

function sv(setter: (v: string) => void) {
  return (v: string | null) => setter(v ?? "");
}

export function QCFilter() {
  const store = useQCStore();
  const { data: inspections = [] } = useQCs();

  const BUNDLES = Array.from(new Set(inspections.map(i => i.bundleNumber).filter(Boolean)));
  const POS = Array.from(new Set(inspections.map(i => i.productionOrder).filter(Boolean)));
  const WORKERS = Array.from(new Set(inspections.map(i => i.worker).filter(Boolean)));
  const MACHINES = Array.from(new Set(inspections.map(i => i.machine).filter(Boolean)));
  const DEPARTMENTS = Array.from(new Set(inspections.map(i => i.department).filter(Boolean)));

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 px-6 py-4 border-b border-white/[0.05] bg-zinc-950 flex-shrink-0 flex-wrap">
      {/* Search */}
      <div className="relative w-full md:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          placeholder="Search ID or Inspector..."
          value={store.searchQuery}
          onChange={(e) => store.setSearchQuery(e.target.value)}
          className="pl-9 bg-zinc-900/50 border-white/10 text-white placeholder:text-white/30 h-10"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Select value={store.bundleFilter} onValueChange={sv(store.setBundleFilter)}>
          <SelectTrigger className="w-[150px] bg-zinc-900/50 border-white/10 h-10 text-sm">
            <span className="text-white/40 mr-1">Bundle:</span>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {BUNDLES.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={store.poFilter} onValueChange={sv(store.setPoFilter)}>
          <SelectTrigger className="w-[150px] bg-zinc-900/50 border-white/10 h-10 text-sm">
            <span className="text-white/40 mr-1">Order:</span>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {POS.map((po) => (
              <SelectItem key={po} value={po}>{po}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={store.workerFilter} onValueChange={sv(store.setWorkerFilter)}>
          <SelectTrigger className="w-[170px] bg-zinc-900/50 border-white/10 h-10 text-sm truncate">
            <span className="text-white/40 mr-1">Worker:</span>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {WORKERS.map((w) => (
              <SelectItem key={w} value={w}>{w}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={store.machineFilter} onValueChange={sv(store.setMachineFilter)}>
          <SelectTrigger className="w-[150px] bg-zinc-900/50 border-white/10 h-10 text-sm">
            <span className="text-white/40 mr-1">Machine:</span>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {MACHINES.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={store.departmentFilter} onValueChange={sv(store.setDepartmentFilter)}>
          <SelectTrigger className="w-[170px] bg-zinc-900/50 border-white/10 h-10 text-sm">
            <span className="text-white/40 mr-1">Department:</span>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          onClick={store.resetFilters}
          className="flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white transition-colors h-10 rounded-md hover:bg-white/5 whitespace-nowrap"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </div>
  );
}
