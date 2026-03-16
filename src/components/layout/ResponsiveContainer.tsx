import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

interface Props {
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * レスポンシブコンテナ
 * iPad横向き時にサイドバー + メインコンテンツのSplit View表示
 * モバイルではメインコンテンツのみ
 */
export function ResponsiveContainer({ sidebar, children }: Props) {
  const { showSidebar, showSplitView } = useResponsiveLayout();

  if (showSplitView && sidebar) {
    return (
      <View style={styles.splitContainer}>
        <View style={styles.sidebar}>{sidebar}</View>
        <View style={styles.mainContent}>{children}</View>
      </View>
    );
  }

  return <View style={styles.container}>{children}</View>;
}

const SIDEBAR_WIDTH = 320;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  mainContent: {
    flex: 1,
  },
});
