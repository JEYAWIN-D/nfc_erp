import { create } from 'zustand';
import type { MachineStatus } from '../types/factory.types';

export type ViewMode = '2d' | 'pseudo3d' | '3d';
export type DrillLevel = 'facility' | 'floor' | 'room' | 'row';
export type HeatmapMode = 'status' | 'reason';

interface FactoryStore {
  // Existing
  selectedMachineId: string | null;
  selectMachine: (id: string | null) => void;
  hoveredMachineId: string | null;
  hoverMachine: (id: string | null) => void;
  statusFilter: MachineStatus | 'all';
  setStatusFilter: (status: MachineStatus | 'all') => void;
  buildingFilter: string | 'all';
  setBuildingFilter: (buildingId: string | 'all') => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Drill-down navigation
  drillLevel: DrillLevel;
  selectedFloorId: string | null;
  selectedRoomId: string | null;
  selectedRowId: string | null;
  drillToFloor: (floorId: string) => void;
  drillToRoom: (roomId: string) => void;
  drillToRow: (rowId: string) => void;
  drillUp: (level: DrillLevel) => void;

  // Heatmap
  heatmapMode: HeatmapMode | null; // null = normal status coloring
  setHeatmapMode: (mode: HeatmapMode | null) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const useFactoryStore = create<FactoryStore>((set) => ({
  selectedMachineId: null,
  selectMachine: (id) => set({ selectedMachineId: id }),
  hoveredMachineId: null,
  hoverMachine: (id) => set({ hoveredMachineId: id }),
  statusFilter: 'all',
  setStatusFilter: (status) => set({ statusFilter: status }),
  buildingFilter: 'all',
  setBuildingFilter: (buildingId) => set({ buildingFilter: buildingId }),
  zoom: 1,
  setZoom: (zoom) => set({ zoom: Math.min(Math.max(zoom, 0.5), 2) }),
  viewMode: '2d',
  setViewMode: (mode) => set({ viewMode: mode }),

  // Drill-down
  drillLevel: 'facility',
  selectedFloorId: null,
  selectedRoomId: null,
  selectedRowId: null,
  drillToFloor: (floorId) => set({ drillLevel: 'floor', selectedFloorId: floorId, selectedRoomId: null, selectedRowId: null }),
  drillToRoom: (roomId) => set({ drillLevel: 'room', selectedRoomId: roomId, selectedRowId: null }),
  drillToRow: (rowId) => set({ drillLevel: 'row', selectedRowId: rowId }),
  drillUp: (level) => {
    if (level === 'facility') set({ drillLevel: 'facility', selectedFloorId: null, selectedRoomId: null, selectedRowId: null, selectedMachineId: null });
    else if (level === 'floor') set({ drillLevel: 'floor', selectedRoomId: null, selectedRowId: null, selectedMachineId: null });
    else if (level === 'room') set({ drillLevel: 'room', selectedRowId: null, selectedMachineId: null });
  },

  // Heatmap
  heatmapMode: null,
  setHeatmapMode: (mode) => set({ heatmapMode: mode }),

  // Search
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
}));
