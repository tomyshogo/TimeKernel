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

const MAX_CHIPS = 2;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DayCell({ date, currentMonth, isSelected, events, onPress }: Props) {
  const today = isToday(date);
  const inMonth = isSameMonth(date, currentMonth);
  const visibleEvents = events.slice(0, MAX_CHIPS);
  const overflow = events.length > MAX_CHIPS ? events.length - MAX_CHIPS : 0;
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
      <View style={styles.chipArea}>
        {visibleEvents.map((event, i) => (
          <View
            key={i}
            style={[
              styles.chip,
              { backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : event.color + '22' },
              { borderLeftColor: isSelected ? '#ffffffCC' : event.color },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: isSelected ? '#fff' : event.color },
              ]}
              numberOfLines={1}
            >
              {event.title}
            </Text>
          </View>
        ))}
        {overflow > 0 && (
          <Text style={[styles.overflowText, isSelected && styles.selectedOverflow]}>
            +{overflow}件
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
    paddingVertical: 2,
    minHeight: 62,
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    fontSize: 13,
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
  chipArea: {
    width: '100%',
    paddingHorizontal: 1,
    marginTop: 1,
    gap: 1,
  },
  chip: {
    borderLeftWidth: 2,
    borderRadius: 2,
    paddingHorizontal: 2,
    paddingVertical: 0.5,
  },
  chipText: {
    fontSize: 8,
    fontWeight: '600',
    lineHeight: 10,
  },
  overflowText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#95a5a6',
    textAlign: 'center',
  },
  selectedOverflow: {
    color: '#ffffffCC',
  },
});
