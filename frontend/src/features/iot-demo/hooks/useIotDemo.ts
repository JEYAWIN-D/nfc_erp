import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socketService } from '@/services/socket';
import { useIotDemoStore } from '../store/iot-demo.store';
import { attendanceService } from '@/features/attendance/services/attendance.service';
import type { DemoActivityLog } from '../types/iot-demo.types';

import { useSearchParams } from 'react-router-dom';

export function useIotDemo() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const urlOrderId = searchParams.get('orderId');
  const { strategy, selectedOrderId, setSelectedOrderId, addLog, setLogs } = useIotDemoStore();

  useEffect(() => {
    if (urlOrderId) {
      const parsedId = Number(urlOrderId);
      if (!isNaN(parsedId) && parsedId !== selectedOrderId) {
        setSelectedOrderId(parsedId);
      }
    }
  }, [urlOrderId]);

  // 1. Order Workflow Context Query
  const contextQuery = useQuery({
    queryKey: ['iot-demo-context', selectedOrderId],
    queryFn: () => strategy.getContext(selectedOrderId ?? undefined),
    staleTime: 0,
    refetchOnMount: true,
  });

  // Automatically select active/newly created order if none selected or stale ID
  useEffect(() => {
    if (contextQuery.data?.selectedOrder?.id) {
      const activeId = contextQuery.data.selectedOrder.id;
      if (!selectedOrderId || selectedOrderId !== activeId) {
        setSelectedOrderId(activeId);
      }
    } else if (contextQuery.data?.orders?.length) {
      const targetOrder = contextQuery.data.orders.find((o: any) => 
        o.status === 'READY_FOR_PRODUCTION' || o.status === 'RUNNING' || o.status === 'IN_PROGRESS' || o.status === 'PLANNED' || o.status === 'DRAFT'
      ) || contextQuery.data.orders[0];
      if (targetOrder && targetOrder.id !== selectedOrderId) {
        setSelectedOrderId(targetOrder.id);
      }
    }
  }, [contextQuery.data, selectedOrderId, setSelectedOrderId]);

  // 2. Attendance Query
  const attendancesQuery = useQuery({
    queryKey: ['attendances'],
    queryFn: attendanceService.getTodayAttendance,
    staleTime: 5000,
  });

  // 3. Activity Logs Query
  const logsQuery = useQuery({
    queryKey: ['iot-demo-logs'],
    queryFn: () => strategy.getLogs(),
    staleTime: 5000,
  });

  useEffect(() => {
    if (logsQuery.data) {
      setLogs(logsQuery.data);
    }
  }, [logsQuery.data, setLogs]);

  // Real-time WebSocket Listeners
  useEffect(() => {
    const socket = socketService.connect();

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: ['iot-demo-context'] });
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['planning'] });
    };

    socket.on('attendance.updated', invalidateAll);
    socket.on('machine.updated', invalidateAll);
    socket.on('bundle.updated', invalidateAll);
    socket.on('dashboard.refresh', invalidateAll);

    const handleLog = (entry: DemoActivityLog) => {
      addLog(entry);
    };
    socket.on('iot.demo.log', handleLog);

    return () => {
      socket.off('attendance.updated', invalidateAll);
      socket.off('machine.updated', invalidateAll);
      socket.off('bundle.updated', invalidateAll);
      socket.off('dashboard.refresh', invalidateAll);
      socket.off('iot.demo.log', handleLog);
    };
  }, [queryClient, addLog]);

  // Mutations
  const toggleWorkerMutation = useMutation({
    mutationFn: (workerId: number) => strategy.toggleWorker(workerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iot-demo-context'] });
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
    },
  });

  const toggleMachineMutation = useMutation({
    mutationFn: ({ machineId, targetStatus }: { machineId: number; targetStatus?: string }) =>
      strategy.toggleMachine(machineId, targetStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iot-demo-context'] });
    },
  });

  const advanceBundleMutation = useMutation({
    mutationFn: (payload: { bundleId: number; workerId?: number } | number) => {
      const bundleId = typeof payload === 'number' ? payload : payload.bundleId;
      const workerId = typeof payload === 'number' ? undefined : payload.workerId;
      return strategy.advanceBundle(bundleId, workerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iot-demo-context'] });
    },
  });

  const resetDemoMutation = useMutation({
    mutationFn: (productionOrderId?: number) => strategy.resetDemo(productionOrderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iot-demo-context'] });
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      useIotDemoStore.getState().clearLogs();
    },
  });

  const context = contextQuery.data || {
    orders: [],
    selectedOrder: null,
    tasks: [],
    operations: [],
    bundles: [],
  };

  const contextAttendances = context.attendances || [];
  const rawAttendances = (attendancesQuery.data as any)?.data?.data || (attendancesQuery.data as any)?.data || (Array.isArray(attendancesQuery.data) ? attendancesQuery.data : []);
  const combinedAttendances = [...contextAttendances, ...rawAttendances];

  return {
    context,
    orders: context.orders || [],
    selectedOrder: context.selectedOrder || null,
    tasks: context.tasks || [],
    operations: context.operations || [],
    bundles: context.bundles || [],
    attendances: combinedAttendances,
    workerTimingStats: context.workerTimingStats || {},
    isLoading: contextQuery.isLoading,
    toggleWorker: toggleWorkerMutation.mutate,
    isTogglingWorker: toggleWorkerMutation.isPending,
    toggleMachine: toggleMachineMutation.mutate,
    isTogglingMachine: toggleMachineMutation.isPending,
    advanceBundle: advanceBundleMutation.mutate,
    isAdvancingBundle: advanceBundleMutation.isPending,
    resetDemo: resetDemoMutation.mutate,
    isResettingDemo: resetDemoMutation.isPending,
  };
}
