import { create } from 'zustand';
import type { TPSData, TPSSensorUpdate } from '@/types/tps';

type TPSStore = {
  selectedTPSId: string | null;
  tpsById: Record<string, TPSData>;
  nearbyTpsList: TPSData[];
  setSelectedTPSId: (id: string | null) => void;
  upsertTPSList: (list: TPSData[]) => void;
  setNearbyTpsList: (list: TPSData[]) => void;
  updateSensorData: (id: string, data: TPSSensorUpdate) => void;
};

const createPlaceholderTPS = (id: string, data: TPSSensorUpdate): TPSData => ({
  id,
  name: '',
  fullness: data.fullness,
  ammonia: data.ammonia,
  temperature: data.temperature,
  lastUpdate: data.lastUpdate,
  latitude: Number.NaN,
  longitude: Number.NaN,
});

export const useTpsStore = create<TPSStore>((set) => ({
  selectedTPSId: null,
  tpsById: {},
  nearbyTpsList: [],
  setSelectedTPSId: (id) => set({ selectedTPSId: id }),
  upsertTPSList: (list) =>
    set((state) => {
      if (!list.length) return state;
      const next = { ...state.tpsById };
      for (const tps of list) {
        next[tps.id] = { ...next[tps.id], ...tps };
      }
      return { tpsById: next };
    }),
  setNearbyTpsList: (list) => set({ nearbyTpsList: list }),
  updateSensorData: (id, data) =>
    set((state) => {
      const existing = state.tpsById[id];
      const base = existing ? { ...existing } : createPlaceholderTPS(id, data);
      return {
        tpsById: {
          ...state.tpsById,
          [id]: {
            ...base,
            fullness: data.fullness,
            ammonia: data.ammonia,
            temperature: data.temperature,
            lastUpdate: data.lastUpdate,
          },
        },
      };
    }),
}));
