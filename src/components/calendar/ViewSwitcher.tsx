import React, { useCallback } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { CalendarViewType } from '../../stores/uiStore';
import * as Haptics from 'expo-haptics';

interface Props {
  current: CalendarViewType;
  onChange: (view: CalendarViewType) => void;
}

const VIEW_OPTIONS: { key: CalendarViewType; label: string }[] = [
  { key: 'month', label: '月' },
  { key: 'week', label: '週' },
  { key: '3day', label: '3日' },
  { key: 'day', label: '日' },
  { key: 'agenda', label: '一覧' },
];

const SPRING = { damping: 18, stiffness: 180 };

export function ViewSwitcher({ current, onChange }: Props) {
  const containerWidth = useSharedValue(0);
  const tabWidth = useSharedValue(0);

  const currentIndex = VIEW_OPTIONS.findIndex((v) => v.key === current);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width - 4; // padding
    containerWidth.value = w;
    tabWidth.value = w / VIEW_OPTIONS.length;
  }, []);

  const indicatorStyle = useAnimatedStyle(() => {
    if (tabWidth.value === 0) return {};
    return {
      width: tabWidth.value,
      transform: [
        { translateX: withSpring(currentIndex * tabWidth.value, SPRING) },
      ],
    };
  });

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      {VIEW_OPTIONS.map(({ key, label }) => (
        <Pressable
          key={key}
          style={styles.tab}
          onPress={() => {
            Haptics.selectionAsync();
            onChange(key);
          }}
        >
          <Text style={[styles.label, current === key && styles.activeLabel]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
    padding: 2,
    marginHorizontal: 16,
    marginVertical: 8,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 2,
    left: 2,
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    zIndex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#95a5a6',
  },
  activeLabel: {
    color: '#3498db',
    fontWeight: '800',
  },
});
