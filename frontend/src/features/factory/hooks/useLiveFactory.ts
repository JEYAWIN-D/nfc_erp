import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '@/services/axios';
import { socketService } from '@/services/socket';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LiveMachine {
  id: string;
  machineCode: string;
  machineName: string;
  machineLabel: string; // e.g. "A14"
  side: 'top' | 'bottom';
  positionIndex: number;
  status: string; // running | offline | idle | maintenance | no_worker
  machineType: string;
  worker: { id: number; name: string; employeeCode: string } | null;
  operation: string | null;
  shift: string | null;
  currentEvent: {
    status: string;
    reasonCode: string | null;
    reasonLabel: string | null;
    reasonIcon: string | null;
    note: string | null;
    changedAt: string;
    durationMs: number | null;
    isSystemGenerated: boolean;
  } | null;
}

export interface LiveRow {
  id: string;
  name: string;
  label: string;
  sortOrder: number;
  machineCount: number;
  machines: LiveMachine[];
}

export interface LiveRoom {
  id: string;
  dbId: number;
  name: string;
  roomType: string;
  rowCount: number;
  machineCount: number;
  runningCount: number;
  utilizationPct: number;
  rows: LiveRow[];
}

export interface LiveFloor {
  id: string;
  dbId: number;
  name: string;
  floorNumber: number;
  roomCount: number;
  machineCount: number;
  rooms: LiveRoom[];
}

export interface TickerEvent {
  id: number;
  machineId: number;
  machine: { machineName: string; machineCode: string };
  status: string;
  reasonCode?: { label: string; iconName?: string };
  note: string | null;
  changedAt: string;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useLiveFactory() {
  const [floors, setFloors] = useState<LiveFloor[]>([]);
  const [tickerEvents, setTickerEvents] = useState<TickerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const mountedRef = useRef(true);

  const loadSnapshot = useCallback(async () => {
    try {
      const res = await apiClient.get<{ data: { floors: LiveFloor[] } }>('/live-factory/snapshot');
      if (mountedRef.current) setFloors(res.data.data.floors ?? []);
    } catch (e) {
      console.error('Failed to load live factory snapshot', e);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const loadTicker = useCallback(async () => {
    try {
      const res = await apiClient.get<{ data: TickerEvent[] }>('/live-factory/ticker?limit=10');
      if (mountedRef.current) setTickerEvents(res.data.data ?? []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadSnapshot();
    loadTicker();

    // Auto refresh every 15s
    const interval = setInterval(loadSnapshot, 15_000);

    // WebSocket
    const socket = socketService.connect();

    socket.on('connect', () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));

    socket.on('machine.status_changed', (payload: any) => {
      setFloors((prev) =>
        prev.map((floor) => ({
          ...floor,
          rooms: floor.rooms.map((room) => ({
            ...room,
            rows: room.rows.map((row) => ({
              ...row,
              machines: row.machines.map((m) =>
                m.id === String(payload.machineId)
                  ? { ...m, status: payload.status.toLowerCase() }
                  : m
              ),
            })),
          })),
        }))
      );
    });

    socket.on('factory.ticker', (payload: TickerEvent) => {
      setTickerEvents((prev) => [payload, ...prev.slice(0, 9)]);
    });

    socket.on('bundle.updated', () => {
      loadSnapshot();
    });

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('machine.status_changed');
      socket.off('factory.ticker');
      socket.off('bundle.updated');
    };
  }, [loadSnapshot, loadTicker]);

  // Jump to machine by label (e.g. "A14")
  const jumpToMachine = useCallback((label: string): LiveMachine | null => {
    for (const floor of floors) {
      for (const room of floor.rooms) {
        for (const row of room.rows) {
          const found = row.machines.find(
            (m) => m.machineLabel.toLowerCase() === label.toLowerCase()
          );
          if (found) return found;
        }
      }
    }
    return null;
  }, [floors]);

  return { floors, tickerEvents, loading, wsConnected, jumpToMachine, refresh: loadSnapshot };
}
