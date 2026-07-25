import { Search, RotateCcw } from "lucide-react";
import { useMachineStore } from "../store/machine.store";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEPARTMENTS = [
  "Stitching",
  "Cutting",
  "Finishing",
  "Packing",
  "Embroidery",
];
const MACHINE_TYPES = [
  "Single Needle",
  "Double Needle",
  "Overlock",
  "Flatlock",
  "Interlock",
  "Bar Tack",
  "Button Hole",
  "Feed Off Arm",
  "Embroidery",
  "Cutting",
];
const BUILDINGS = ["Block-A", "Block-B", "Block-C"];
const FLOORS = ["Ground", "First", "Second"];
const LINES = ["Line-1", "Line-2", "Line-3", "Line-4"];
const STATUSES = ["running", "idle", "offline", "maintenance", "error"];
const HEALTHS = ["healthy", "warning", "critical", "unknown"];

// Base UI Select passes `string | null` — this helper coerces null → ""
function sv(setter: (v: string) => void) {
  return (v: string | null) => setter(v ?? "");
}

export function MachinesFilter() {
  const store = useMachineStore();

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 px-6 py-4 border-b border-white/[0.05] bg-zinc-950 flex-shrink-0 flex-wrap">
      {/* Search */}
      <div className="relative w-full md:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          id="machine-search"
          placeholder="Search machine ID or name..."
          value={store.searchQuery}
          onChange={(e) => store.setSearchQuery(e.target.value)}
          className="pl-9 bg-zinc-900/50 border-white/10 text-white placeholder:text-white/30 h-10"
        />
      </div>

      {/* Filters Row */}
      {/* Filters Row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={store.departmentFilter}
          onValueChange={sv(store.setDepartmentFilter)}
        >
          <SelectTrigger
            id="filter-department"
            className="min-w-[150px] w-auto bg-zinc-900/50 border-white/10 h-10 text-sm px-3"
          >
            <span className="truncate">
              <span className="text-white/40 mr-1.5 font-medium">Dept:</span>
              <span className="text-white font-semibold">{store.departmentFilter === "all" || !store.departmentFilter ? "All" : store.departmentFilter}</span>
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={store.buildingFilter}
          onValueChange={sv(store.setBuildingFilter)}
        >
          <SelectTrigger
            id="filter-building"
            className="min-w-[140px] w-auto bg-zinc-900/50 border-white/10 h-10 text-sm px-3"
          >
            <span className="truncate">
              <span className="text-white/40 mr-1.5 font-medium">Building:</span>
              <span className="text-white font-semibold">{store.buildingFilter === "all" || !store.buildingFilter ? "All" : store.buildingFilter}</span>
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Buildings</SelectItem>
            {BUILDINGS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={store.floorFilter}
          onValueChange={sv(store.setFloorFilter)}
        >
          <SelectTrigger
            id="filter-floor"
            className="min-w-[130px] w-auto bg-zinc-900/50 border-white/10 h-10 text-sm px-3"
          >
            <span className="truncate">
              <span className="text-white/40 mr-1.5 font-medium">Floor:</span>
              <span className="text-white font-semibold">{store.floorFilter === "all" || !store.floorFilter ? "All" : store.floorFilter}</span>
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Floors</SelectItem>
            {FLOORS.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={store.productionLineFilter}
          onValueChange={sv(store.setProductionLineFilter)}
        >
          <SelectTrigger
            id="filter-line"
            className="min-w-[130px] w-auto bg-zinc-900/50 border-white/10 h-10 text-sm px-3"
          >
            <span className="truncate">
              <span className="text-white/40 mr-1.5 font-medium">Line:</span>
              <span className="text-white font-semibold">{store.productionLineFilter === "all" || !store.productionLineFilter ? "All" : store.productionLineFilter}</span>
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lines</SelectItem>
            {LINES.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={store.typeFilter}
          onValueChange={sv(store.setTypeFilter)}
        >
          <SelectTrigger
            id="filter-type"
            className="min-w-[150px] w-auto bg-zinc-900/50 border-white/10 h-10 text-sm px-3"
          >
            <span className="truncate">
              <span className="text-white/40 mr-1.5 font-medium">Type:</span>
              <span className="text-white font-semibold">{store.typeFilter === "all" || !store.typeFilter ? "All" : store.typeFilter}</span>
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {MACHINE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={store.statusFilter}
          onValueChange={sv(store.setStatusFilter)}
        >
          <SelectTrigger
            id="filter-status"
            className="min-w-[140px] w-auto bg-zinc-900/50 border-white/10 h-10 text-sm px-3"
          >
            <span className="truncate">
              <span className="text-white/40 mr-1.5 font-medium">Status:</span>
              <span className="text-white font-semibold">
                {store.statusFilter === "all" || !store.statusFilter
                  ? "All"
                  : store.statusFilter.charAt(0).toUpperCase() + store.statusFilter.slice(1)}
              </span>
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={store.healthFilter}
          onValueChange={sv(store.setHealthFilter)}
        >
          <SelectTrigger
            id="filter-health"
            className="min-w-[140px] w-auto bg-zinc-900/50 border-white/10 h-10 text-sm px-3"
          >
            <span className="truncate">
              <span className="text-white/40 mr-1.5 font-medium">Health:</span>
              <span className="text-white font-semibold">
                {store.healthFilter === "all" || !store.healthFilter
                  ? "All"
                  : store.healthFilter.charAt(0).toUpperCase() + store.healthFilter.slice(1)}
              </span>
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Health</SelectItem>
            {HEALTHS.map((h) => (
              <SelectItem key={h} value={h}>
                {h.charAt(0).toUpperCase() + h.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          id="filter-reset"
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
