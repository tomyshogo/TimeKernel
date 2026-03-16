import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { CalendarEvent } from '../../types';
import { isToday, isSameMonth } from '../../utils/dateHelpers';

interface Props {
  date: Date;
  currentMonth: Date;
  isSelected: boolean;
  events: CalendarEvent[];
  onPress: () => void;
}

const MAX_DOTS = 4;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DayCell({ date, currentMonth, isSelected, events, onPress }: Props) {
  const today = isToday(date);
  const inMonth = isSameMonth(date, currentMonth);
  const uniqueColors = [...new Set(events.map((e) => e.color))];
  const visibleColors = uniqueColors.slice(0, MAX_DOTS);
  const overflow = events.length > MAX_DOTS ? events.length - MAX_DOTS : 0;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.cell, animatedStyle]}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.9, { damping: 12, stiffness: 250 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 250 }); }}
    >
      <View style={[
        styles.dayCircle,
        isSelected && styles.selected,
        today && !isSelected && styles.todayCircle,
      ]}>
        <Text
          style={[
            styles.dayText,
            !inMonth && styles.outsideMonth,
            today && styles.todayText,
            isSelected && styles.selectedText,
          ]}
        >
          {date.getDate()}
        </Text>
      </View>
      <View style={styles.dots}>
        {visibleColors.map((color, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: isSelected ? '#ffffffCC' : color },
            ]}
          />
        ))}
        {overflow > 0 && (
          <Text style={[styles.overflowText, isSelected && styles.selectedOverflow]}>
            +{overflow}
          </Text>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: '#3498db',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  todayCircle: {
    backgroundColor: '#ebf5fb',
    borderWidth: 2,
    borderColor: '#3498db',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  outsideMonth: {
    color: '#d5d8dc',
  },
  todayText: {
    fontWeight: '800',
    color: '#3498db',
  },
  selectedText: {
    color: '#fff',
    fontWeight: '800',
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 3,
    height: 6,
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  overflowText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#95a5a6',
  },
  selectedOverflow: {
    color: '#ffffffCC',
  },
});
