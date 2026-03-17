import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStore } from '../stores/networkStore';
import { toast } from '../components/ui/Toast';

export function useNetwork() {
  const { isConnected, isSyncing, pendingActions, setIsConnected, setIsSyncing, clearPendingActions } =
    useNetworkStore();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;
      const store = useNetworkStore.getState();
      const wasDisconnected = !store.isConnected;

      setIsConnected(connected);

      // オフライン→オンライン復帰時に同期中表示
      if (connected && wasDisconnected) {
        setIsSyncing(true);
        const pending = store.pendingActions;
        // Firestoreが自動同期するので、少し待ってから同期完了にする
        setTimeout(() => {
          setIsSyncing(false);
          if (pending > 0) {
            toast.success(`${pending}件のデータを同期しました`);
            clearPendingActions();
          } else {
            toast.info('オンラインに復帰しました');
          }
        }, 3000);
      }

      // オンライン→オフライン時に通知
      if (!connected && !wasDisconnected) {
        toast.error('オフラインです。変更はオンライン復帰時に同期されます');
      }
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, isSyncing, pendingActions };
}
