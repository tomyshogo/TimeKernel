import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetwork } from '../../hooks/useNetwork';
import { useNetworkStore } from '../../stores/networkStore';

export function NetworkBanner() {
  const { isConnected, isSyncing } = useNetwork();
  const pendingActions = useNetworkStore((s) => s.pendingActions);

  if (isConnected && !isSyncing) return null;

  const label = !isConnected
    ? pendingActions > 0
      ? `オフライン（${pendingActions}件の同期待ち）`
      : 'オフライン'
    : '同期中...';
  const bgColor = !isConnected ? '#e74c3c' : '#f39c12';

  return (
    <View style={[styles.banner, { backgroundColor: bgColor }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
