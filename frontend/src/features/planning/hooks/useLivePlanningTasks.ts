import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { socketService } from '@/services/socket';
import { planningService } from '../services/planning.service';

export const PLANNING_TASKS_KEY = ['planning', 'tasks'] as const;

const LIVE_EVENTS = [
  'assignment.created', 'assignment.updated', 'assignment.released',
  'bundle.updated',
  'attendance.updated', 'attendance.in', 'attendance.out', // ← NFC tap auto-moves task columns
  'task.updated', 'dashboard.refresh',
];

export function useLivePlanningTasks() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PLANNING_TASKS_KEY,
    queryFn: () => planningService.getAllTasks(),
    staleTime: 0,
  });

  useEffect(() => {
    const socket = socketService.connect();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: PLANNING_TASKS_KEY });

    LIVE_EVENTS.forEach(evt => socket.on(evt, invalidate));
    socket.on('reconnect', invalidate);

    return () => {
      LIVE_EVENTS.forEach(evt => socket.off(evt, invalidate));
      socket.off('reconnect', invalidate);
    };
  }, [queryClient]);

  return query;
}
