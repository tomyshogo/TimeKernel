import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CalendarEvent } from '../../types';
import { isToday, isSameMonth } from '../../utils/dateHelpers';

interface Props {
  date: Date;
  currentMonth: Date;
  isSelected: boolean;
  events: CalendarEvent[];
  onPress: () => void;
}

const MAX_DOTS = 3;

export function DayCell({ date, currentMonth, isSelected, events, onPress }: Props) {
  const today = isToday(date);
  const inMonth = isSameMonth(date, currentMonth);
  const uniqueColors = [...new Set(events.map((e) => e.color))];
  const visibleColors = uniqueColors.slice(0, MAX_DOTS);
  const overflow = events.length > MAX_DOTS ? events.length - MAX_DOTS : 0;

  return (
    <TouchableOpacity
      style={[styles.cell, isSelected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Text
        style={[
          styles.dayText,
          !inMonth && styles.outsideMonth,
          today && styles.today,
          isSelected && styles.selectedText,
        ]}
      >
        {date.getDate()}
      </Text>
      <View style={styles.dots}>
        {visibleColors.map((color, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: color }]} />
        ))}
        {overflow > 0 && (
          <Text style={[styles.overflowText, isSelected && styles.selectedOverflow]}>
            +{overflow}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  selected: {
    backgroundColor: '#3498db',
    borderRadius: 12,
  },
  dayText: {
    fontSize: 15,
    color: '#2c3e50',
  },
  outsideMonth: {
    color: '#bdc3c7',
  },
  today: {
    fontWeight: '700',
    color: '#3498db',
  },
  selectedText: {
    color: '#fff',
    fontWeight: '700',
  },
  dots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  overflowText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#95a5a6',
  },
  selectedOverflow: {
    color: '#ffffffCC',
  },
});
