import { useState, useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, MoreHorizontal, Eye, FileEdit, Trash2, RefreshCw, Play, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProductionOrderStore } from "../store/production-order.store";
import { useProductionOrders } from "../hooks/useProductionOrderData";
import { useUpdateProductionOrderStatus, useDeleteProductionOrder } from "../hooks/useProductionOrdersHooks";
import type { ProductionOrder } from "../types/production-order.types";
import { OrderStatusBadge, OrderPriorityBadge, ProgressBar } from "./ProductionOrderUIHelpers";

const columnHelper = createColumnHelper<ProductionOrder>();

export function ProductionOrderTable() {
  const navigate = useNavigate();
  const { orders, isLoading, isRefetching, refetch } = useProductionOrders();
  const updateStatusMutation = useUpdateProductionOrderStatus();
  const deleteOrderMutation = useDeleteProductionOrder();
  const store = useProductionOrderStore();
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (store.customerFilter !== "all" && o.customerName !== store.customerFilter) return false;
      if (store.departmentFilter !== "all" && o.department !== store.departmentFilter) return false;
      if (store.statusFilter !== "all" && o.status !== store.statusFilter) return false;
      if (store.priorityFilter !== "all" && o.priority !== store.priorityFilter) return false;
      
      if (store.searchQuery) {
        const q = store.searchQuery.toLowerCase();
        return o.orderNumber.toLowerCase().includes(q) || o.styleNumber.toLowerCase().includes(q);
      }
      return true;
    });
  }, [orders, store.searchQuery, store.customerFilter, store.departmentFilter, store.statusFilter, store.priorityFilter]);

  const columns = useMemo(() => [
    columnHelper.accessor("orderNumber", {
      header: "Order #",
      cell: (info) => <span className="font-mono text-white font-bold">{info.getValue()}</span>,
    }),
    columnHelper.accessor("customerName", {
      header: "Customer",
      cell: (info) => (
        <div className="flex flex-col">
          <span className="text-white font-medium">{info.getValue()}</span>
          <span className="text-xs text-white/40">{info.row.original.styleNumber}</span>
        </div>
      )
    }),
    columnHelper.accessor("department", {
      header: "Department",
      cell: (info) => <span className="text-white/70 text-sm">{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: "progress",
      header: "Progress",
      cell: (info) => {
        const o = info.row.original;
        return (
          <div className="w-32 xl:w-40">
            <ProgressBar target={o.targetQuantity} completed={o.completedQuantity} defective={o.defectiveQuantity} />
          </div>
        );
      }
    }),
    columnHelper.accessor("dueDate", {
      header: "Due Date",
      cell: (info) => (
        <span className="text-white/80 text-sm">
          {new Date(info.getValue()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    }),
    columnHelper.accessor("priority", {
      header: "Priority",
      cell: (info) => <OrderPriorityBadge priority={info.getValue()} />,
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => <OrderStatusBadge status={info.getValue()} />,
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const order = info.row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                localStorage.setItem('planning_selected_order', JSON.stringify(String(order.id)));
                navigate(`/planning/center?orderId=${order.id}`);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 rounded-lg transition-colors cursor-pointer"
              title="Open Production Planning for this order"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Plan Order</span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="p-2 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white outline-none flex items-center justify-center"
              >
                <MoreHorizontal className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-white/10 text-white">
                <DropdownMenuItem 
                  onClick={() => store.setSelectedOrder(order.id)}
                  className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                >
                  <Eye className="w-4 h-4 mr-2" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    localStorage.setItem('planning_selected_order', JSON.stringify(String(order.id)));
                    navigate(`/planning/center?orderId=${order.id}`);
                  }}
                  className="hover:bg-blue-500/20 focus:bg-blue-500/20 text-blue-400 font-semibold cursor-pointer"
                >
                  <Wand2 className="w-4 h-4 mr-2" /> Production Planning
                </DropdownMenuItem>
                {(order.status === 'ready_for_production' || order.status === 'planned' || order.status === 'running') && (
                  <DropdownMenuItem 
                    onClick={() => navigate(`/iot-demo?orderId=${order.id}`)}
                    className="hover:bg-emerald-500/20 focus:bg-emerald-500/20 text-emerald-400 font-semibold cursor-pointer"
                  >
                    <Play className="w-4 h-4 mr-2" /> Start Production
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  className="hover:bg-white/10 focus:bg-white/10 cursor-pointer" 
                  onClick={() => store.setEditModalOpen(true, order.id)}
                >
                  <FileEdit className="w-4 h-4 mr-2" /> Edit Order
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  className="hover:bg-amber-500/20 focus:bg-amber-500/20 text-amber-400 cursor-pointer" 
                  onClick={() => { 
                    setTimeout(() => {
                      if(confirm(`Close Order ${order.orderNumber}?`)) {
                        updateStatusMutation.mutate({ id: order.id, status: "CLOSED" });
                      }
                    }, 100);
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Close Order
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="hover:bg-rose-500/20 focus:bg-rose-500/20 text-rose-400 cursor-pointer" 
                  onClick={() => { 
                    setTimeout(() => {
                      if(confirm(`Are you sure you want to DELETE Order ${order.orderNumber}?\n\nThis will release all assigned workers and machines so they become available again, and archive order history.`)) {
                        deleteOrderMutation.mutate(order.id);
                      }
                    }, 100);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Order (Release Resources)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    }),
  ], [store, updateStatusMutation, deleteOrderMutation]);

  const table = useReactTable({
    data: filteredOrders,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-zinc-950 relative">
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.05]">
        <h2 className="text-white font-medium">Orders</h2>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 text-white rounded-md transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
          Refresh
        </button>
      </div>
      {isLoading && (
        <div className="absolute inset-0 bg-zinc-950/50 flex items-center justify-center z-20 mt-14">
          <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
        </div>
      )}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-zinc-900/90 backdrop-blur-md border-b border-white/10 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-xs font-semibold text-white/50 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-white transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: <ChevronUp className="w-3 h-3" />,
                        desc: <ChevronDown className="w-3 h-3" />,
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('[role="menuitem"]')) return;
                    store.setSelectedOrder(row.original.id);
                  }}
                  className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-white/40">
                  No production orders found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.05] bg-zinc-950 flex-shrink-0">
        <div className="text-sm text-white/50">
          Showing <span className="text-white font-medium">{table.getRowModel().rows.length}</span> of{" "}
          <span className="text-white font-medium">{table.getFilteredRowModel().rows.length}</span> orders
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-1 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            className="p-1 rounded hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
