import { create } from 'zustand';

interface NetworkState {
  isConnected: boolean;
  isSyncing: boolean;
  setIsConnected: (connected: boolean) => void;
  setIsSyncing: (syncing: boolean) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: true,
  isSyncing: false,
  setIsConnected: (isConnected) => set({ isConnected }),
  setIsSyncing: (isSyncing) => set({ isSyncing }),
}));
