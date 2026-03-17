import { create } from 'zustand';

interface NetworkState {
  isConnected: boolean;
  isSyncing: boolean;
  pendingActions: number;
  setIsConnected: (connected: boolean) => void;
  setIsSyncing: (syncing: boolean) => void;
  addPendingAction: () => void;
  clearPendingActions: () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: true,
  isSyncing: false,
  pendingActions: 0,
  setIsConnected: (isConnected) => set({ isConnected }),
  setIsSyncing: (isSyncing) => set({ isSyncing }),
  addPendingAction: () => set((s) => ({ pendingActions: s.pendingActions + 1 })),
  clearPendingActions: () => set({ pendingActions: 0 }),
}));
