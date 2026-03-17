import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** タスクリスト用のスケルトン */
export function TaskListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.taskCard}>
          <View style={styles.taskRow}>
            <Skeleton width={16} height={16} borderRadius={8} />
            <Skeleton width="60%" height={16} style={{ marginLeft: 10 }} />
          </View>
          <View style={styles.taskRow}>
            <Skeleton width="30%" height={12} />
            <Skeleton width="20%" height={12} />
          </View>
          <Skeleton width="15%" height={12} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  );
}

/** カレンダー日詳細のスケルトン */
export function DayDetailSkeleton() {
  return (
    <View style={styles.dayDetailContainer}>
      <Skeleton width="40%" height={16} style={{ marginBottom: 12 }} />
      {[1, 2].map((i) => (
        <View key={i} style={styles.eventSkeleton}>
          <Skeleton width={4} height={40} borderRadius={2} />
          <View style={styles.eventSkeletonContent}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="40%" height={12} style={{ marginTop: 4 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e0e0e0',
  },
  listContainer: {
    paddingVertical: 8,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    gap: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayDetailContainer: {
    padding: 16,
  },
  eventSkeleton: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  eventSkeletonContent: {
    flex: 1,
    marginLeft: 10,
  },
});
