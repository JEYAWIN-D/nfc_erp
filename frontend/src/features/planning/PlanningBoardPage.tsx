import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { Activity, Clock, GripVertical, Play } from "lucide-react";
import { useLivePlanningTasks } from "./hooks/useLivePlanningTasks";
import { usePlanningMutations } from "./hooks/usePlanningMutations";
import type { ProductionTask, TaskStatus } from "./types/planning.types";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlanningHistoryTab } from "./components/PlanningHistoryTab";

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
  const { data: serverTasks, isLoading: loading } = useLivePlanningTasks();
  const { updateTask } = usePlanningMutations();
  
  // Local state for optimistic drag-and-drop
  const [tasks, setTasks] = useState<ProductionTask[]>([]);

  useEffect(() => {
    if (serverTasks) {
      setTasks(serverTasks);
    }
  }, [serverTasks]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const taskId = Number(draggableId);
    const newStatus = destination.droppableId as TaskStatus;
    
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    updateTask.mutate({ id: taskId, data: { status: newStatus } }, {
      onError: () => {
        // Revert on fail
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
      <div className="flex items-center justify-between flex-shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Planning Board</h1>
          <p className="text-sm text-white/50 mt-1">Drag and drop tasks through the production lifecycle</p>
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
                  const columnTasks = tasks.filter((t) => t.status === column.id);
                  
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
                            {columnTasks.map((task, index) => (
                              <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={cn(
                                      "bg-zinc-800 border rounded-lg p-3 shadow-sm select-none group",
                                      snapshot.isDragging ? "border-emerald-500 shadow-emerald-500/20 shadow-xl" : "border-white/10 hover:border-white/20"
                                    )}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-1.5">
                                        <div {...provided.dragHandleProps} className="text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing">
                                          <GripVertical className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-mono font-bold text-emerald-400">{task.taskId}</span>
                                      </div>
                                      <span className={cn(
                                        "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                                        task.priority > 0 ? "bg-red-500/20 text-red-400" : "bg-zinc-700 text-white/60"
                                      )}>
                                        {task.priority > 0 ? 'High' : 'Norm'}
                                      </span>
                                    </div>
                                    
                                    <div className="text-sm font-medium text-white mb-1">
                                      {task.operation?.operationName || "Unknown Operation"}
                                    </div>
                                    <div className="text-xs text-white/50 mb-3 flex items-center justify-between">
                                      <span>Qty: {task.targetQuantity}</span>
                                      <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {task.estimatedTime}m</span>
                                    </div>
                                    
                                    {(task.worker || task.machine) && (
                                      <div className="pt-2 border-t border-white/5 flex items-center justify-between mt-2">
                                        {task.worker ? (
                                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold" title={task.worker.firstName}>
                                            {task.worker.firstName.charAt(0)}{task.worker.lastName.charAt(0)}
                                          </div>
                                        ) : <div className="w-6 h-6" />}
                                        
                                        {task.machine && (
                                          <span className="text-[10px] font-mono bg-zinc-900 px-1.5 py-0.5 rounded text-white/70">
                                            {task.machine.machineCode}
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {(task.status === 'ASSIGNED' || task.status === 'PLANNED' || task.status === 'RUNNING') && task.productionOrderId && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/iot-demo?orderId=${task.productionOrderId}`);
                                        }}
                                        className="w-full mt-2.5 py-1.5 px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                      >
                                        <Play className="w-3.5 h-3.5 fill-current" /> Start Production
                                      </button>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
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
