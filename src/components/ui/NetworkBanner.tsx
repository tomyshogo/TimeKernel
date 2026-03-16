import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetwork } from '../../hooks/useNetwork';

export function NetworkBanner() {
  const { isConnected, isSyncing } = useNetwork();

  if (isConnected && !isSyncing) return null;

  const label = !isConnected ? 'オフライン' : '同期中...';
  const bgColor = !isConnected ? '#e74c3c' : '#f39c12';

  return (
    <View style={[styles.banner, { backgroundColor: bgColor }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
