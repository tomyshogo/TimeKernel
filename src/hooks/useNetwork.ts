import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStore } from '../stores/networkStore';

export function useNetwork() {
  const { isConnected, isSyncing, setIsConnected, setIsSyncing } =
    useNetworkStore();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;
      const wasDisconnected = !useNetworkStore.getState().isConnected;

      setIsConnected(connected);

      // オフライン→オンライン復帰時に同期中表示
      if (connected && wasDisconnected) {
        setIsSyncing(true);
        // Firestoreが自動同期するので、少し待ってから同期完了にする
        setTimeout(() => setIsSyncing(false), 3000);
      }
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, isSyncing };
}
