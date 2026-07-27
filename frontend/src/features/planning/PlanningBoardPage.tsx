import { useNavigate, useSearchParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import {
  Activity,
  Clock,
  GripVertical,
  Play,
  Search,
  Package,
  Cpu,
  FileText,
  RotateCcw,
} from "lucide-react";
import { useLivePlanningTasks } from "./hooks/useLivePlanningTasks";
import { usePlanningMutations } from "./hooks/usePlanningMutations";
import type { ProductionTask, TaskStatus } from "./types/planning.types";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlanningHistoryTab } from "./components/PlanningHistoryTab";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const KANBAN_COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "CREATED", title: "Waiting", color: "bg-zinc-800" },
  { id: "PLANNED", title: "Planned", color: "bg-blue-500/20" },
  { id: "ASSIGNED", title: "Assigned", color: "bg-purple-500/20" },
  { id: "RUNNING", title: "Running", color: "bg-emerald-500/20" },
  { id: "COMPLETED", title: "QC Pending", color: "bg-amber-500/20" },
  { id: "QC", title: "In QC", color: "bg-yellow-500/20" },
  { id: "TRANSFERRED", title: "Transferred", color: "bg-teal-500/20" },
  { id: "CLOSED", title: "Closed", color: "bg-zinc-800/50" }
];

export default function PlanningBoardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: serverTasks, isLoading: loading } = useLivePlanningTasks();
  const { updateTask } = usePlanningMutations();
  
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [selectedOrderFilter, setSelectedOrderFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (serverTasks) {
      setTasks(serverTasks);
    }
  }, [serverTasks]);

  useEffect(() => {
    const urlOrderId = searchParams.get("orderId");
    if (urlOrderId) {
      setSelectedOrderFilter(urlOrderId);
    }
  }, [searchParams]);

  // Extract unique orders from tasks
  const orderOptions = useMemo(() => {
    const map = new Map<number, { id: number; orderNumber: string; buyerName: string; styleNumber: string }>();
    tasks.forEach((t) => {
      if (t.productionOrder) {
        map.set(t.productionOrder.id, {
          id: t.productionOrder.id,
          orderNumber: t.productionOrder.orderNumber,
          buyerName: t.productionOrder.buyerName || "",
          styleNumber: t.productionOrder.styleNumber || "",
        });
      } else if (t.productionOrderId) {
        map.set(t.productionOrderId, {
          id: t.productionOrderId,
          orderNumber: `PO-${t.productionOrderId}`,
          buyerName: "Customer",
          styleNumber: "",
        });
      }
    });
    return Array.from(map.values());
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedOrderFilter !== "all" && String(t.productionOrderId) !== selectedOrderFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const orderNo = (t.productionOrder?.orderNumber || `PO-${t.productionOrderId}`).toLowerCase();
        const buyer = (t.productionOrder?.buyerName || "").toLowerCase();
        const style = (t.productionOrder?.styleNumber || "").toLowerCase();
        const taskCode = (t.taskId || "").toLowerCase();
        const opName = (t.operation?.operationName || "").toLowerCase();
        const workerName = (t.worker ? `${t.worker.firstName} ${t.worker.lastName}` : "").toLowerCase();
        const machineCode = (t.machine?.machineCode || "").toLowerCase();

        return (
          orderNo.includes(q) ||
          buyer.includes(q) ||
          style.includes(q) ||
          taskCode.includes(q) ||
          opName.includes(q) ||
          workerName.includes(q) ||
          machineCode.includes(q)
        );
      }
      return true;
    });
  }, [tasks, selectedOrderFilter, searchQuery]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const taskId = Number(draggableId);
    const newStatus = destination.droppableId as TaskStatus;
    
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    updateTask.mutate({ id: taskId, data: { status: newStatus } }, {
      onError: () => {
        if (serverTasks) setTasks(serverTasks);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-zinc-950">
        <Activity className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white p-6 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-400" />
            Planning Board
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Drag and drop production tasks while tracking assigned orders and resources
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Order Dropdown */}
          <Select value={selectedOrderFilter} onValueChange={(val) => setSelectedOrderFilter(val ?? "all")}>
            <SelectTrigger className="w-[220px] bg-zinc-900 border-white/10 h-10 text-xs">
              <Package className="w-3.5 h-3.5 text-blue-400 mr-2 flex-shrink-0" />
              <SelectValue placeholder="All Production Orders" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10 text-white text-xs">
              <SelectItem value="all">All Production Orders ({tasks.length} tasks)</SelectItem>
              {orderOptions.map((opt) => (
                <SelectItem key={opt.id} value={String(opt.id)}>
                  {opt.orderNumber} {opt.buyerName ? `(${opt.buyerName})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search Input */}
          <div className="relative w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Search Order, Task, Worker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-900 border-white/10 text-white placeholder:text-white/30 h-10 text-xs"
            />
          </div>

          {(selectedOrderFilter !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedOrderFilter("all");
                setSearchQuery("");
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-white/50 hover:text-white transition-colors h-10 rounded-md hover:bg-white/5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      <Tabs defaultValue="board" className="flex-1 flex flex-col min-h-0">
        <TabsList className="bg-zinc-900 border-white/10 mb-4 w-fit">
          <TabsTrigger value="board">Kanban Board</TabsTrigger>
          <TabsTrigger value="history">History Log</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="flex-1 overflow-hidden m-0">
          <div className="h-full overflow-x-auto overflow-y-hidden pb-4">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-4 h-full min-w-max">
                {KANBAN_COLUMNS.map((column) => {
                  const columnTasks = filteredTasks.filter((t) => t.status === column.id);
                  
                  return (
                    <div key={column.id} className="w-80 flex flex-col bg-zinc-900/50 rounded-xl border border-white/5">
                      <div className={cn("px-4 py-3 border-b border-white/5 rounded-t-xl flex items-center justify-between", column.color)}>
                        <h3 className="font-semibold text-sm text-white">{column.title}</h3>
                        <span className="text-xs font-bold bg-black/30 px-2 py-0.5 rounded-full">{columnTasks.length}</span>
                      </div>
                      
                      <Droppable droppableId={column.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              "flex-1 p-3 overflow-y-auto space-y-3 transition-colors",
                              snapshot.isDraggingOver ? "bg-white/[0.02]" : ""
                            )}
                          >
                            {columnTasks.map((task, index) => {
                              const orderNo = task.productionOrder?.orderNumber || (task.productionOrderId ? `PO-${task.productionOrderId}` : 'Unassigned Order');
                              const buyer = task.productionOrder?.buyerName;
                              const style = task.productionOrder?.styleNumber;
                              const workerName = task.worker ? `${task.worker.firstName} ${task.worker.lastName}` : null;

                              return (
                                <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={cn(
                                        "bg-zinc-800 border rounded-lg p-3 shadow-sm select-none group transition-all",
                                        snapshot.isDragging ? "border-emerald-500 shadow-emerald-500/20 shadow-xl" : "border-white/10 hover:border-white/20"
                                      )}
                                    >
                                      {/* Task Header: ID & Priority */}
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-1.5">
                                          <div {...provided.dragHandleProps} className="text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing">
                                            <GripVertical className="w-4 h-4" />
                                          </div>
                                          <span className="text-xs font-mono font-bold text-emerald-400">{task.taskId}</span>
                                        </div>
                                        <span className={cn(
                                          "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                                          task.priority > 0 ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-zinc-700 text-white/60"
                                        )}>
                                          {task.priority > 0 ? 'High' : 'Norm'}
                                        </span>
                                      </div>

                                      {/* Production Order Info Badge */}
                                      <div className="mb-2.5 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-mono font-bold text-blue-400 flex items-center gap-1">
                                            <FileText className="w-3 h-3 text-blue-400" />
                                            {orderNo}
                                          </span>
                                        </div>
                                        {(buyer || style) && (
                                          <p className="text-[11px] text-white/60 font-medium mt-0.5 truncate">
                                            {buyer}{buyer && style ? ' • ' : ''}{style}
                                          </p>
                                        )}
                                      </div>
                                      
                                      {/* Operation Name */}
                                      <div className="text-sm font-semibold text-white mb-1">
                                        {task.operation?.operationName || "Unknown Operation"}
                                      </div>

                                      {/* Target Quantity & Estimated SMV Time */}
                                      <div className="text-xs text-white/50 mb-3 flex items-center justify-between">
                                        <span>Qty: <strong className="text-white">{task.targetQuantity}</strong> pcs</span>
                                        <span className="flex items-center text-white/70"><Clock className="w-3 h-3 mr-1 text-emerald-400" /> {task.estimatedTime}m</span>
                                      </div>
                                      
                                      {/* Worker & Machine Resources */}
                                      {(task.worker || task.machine) && (
                                        <div className="pt-2 border-t border-white/5 flex items-center justify-between mt-2 text-xs">
                                          {task.worker ? (
                                            <div className="flex items-center gap-1.5" title={workerName || ''}>
                                              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-inner flex-shrink-0">
                                                {task.worker.firstName.charAt(0)}{task.worker.lastName.charAt(0)}
                                              </div>
                                              <span className="text-white/70 font-medium truncate max-w-[110px]">
                                                {workerName}
                                              </span>
                                            </div>
                                          ) : <div className="w-6 h-6" />}
                                          
                                          {task.machine && (
                                            <span className="text-[10px] font-mono bg-zinc-900 border border-white/10 px-2 py-0.5 rounded text-white/80 font-bold flex items-center gap-1">
                                              <Cpu className="w-3 h-3 text-emerald-400" />
                                              {task.machine.machineCode}
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      {/* Quick Start Production Action */}
                                      {(task.status === 'ASSIGNED' || task.status === 'PLANNED' || task.status === 'RUNNING') && task.productionOrderId && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/iot-demo?orderId=${task.productionOrderId}`);
                                          }}
                                          className="w-full mt-2.5 py-1.5 px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                                        >
                                          <Play className="w-3.5 h-3.5 fill-current" /> Start Production
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          </div>
        </TabsContent>
        <TabsContent value="history" className="flex-1 overflow-auto m-0">
          <PlanningHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
