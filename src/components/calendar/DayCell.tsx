import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CalendarEvent } from '../../types';
import { isToday, isSameMonth } from '../../utils/dateHelpers';
import { isHoliday } from '../../utils/holidays';

export type SpanPosition = 'start' | 'middle' | 'end' | 'single';

export interface DayEventItem {
  event: CalendarEvent;
  span: SpanPosition;
}

interface Props {
  date: Date;
  currentMonth: Date;
  isSelected: boolean;
  events: DayEventItem[];
  onPress: () => void;
  multiDayBarHeight?: number;
}

const MAX_CHIPS = 4;

export function DayCell({ date, currentMonth, isSelected, events, onPress, multiDayBarHeight = 0 }: Props) {
  const today = isToday(date);
  const inMonth = isSameMonth(date, currentMonth);
  const dayOfWeek = date.getDay();
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;
  const holiday = isHoliday(date);
  const isRed = isSunday || holiday;
  const visibleEvents = events.slice(0, MAX_CHIPS);
  const overflow = events.length > MAX_CHIPS ? events.length - MAX_CHIPS : 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
      onPress={onPress}
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
            inMonth && isRed && !isSelected && styles.sundayText,
            inMonth && isSaturday && !isRed && !isSelected && styles.saturdayText,
            today && styles.todayText,
            today && isRed && !isSelected && styles.todaySundayText,
            isSelected && styles.selectedText,
          ]}
        >
          {date.getDate()}
        </Text>
      </View>
      <View style={[styles.chipArea, { marginTop: multiDayBarHeight > 0 ? multiDayBarHeight + 1 : 1 }]}>
        {visibleEvents.map(({ event }, i) => (
          <View
            key={`${event.id}-${i}`}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : event.color + '22',
                borderLeftColor: isSelected ? '#ffffffCC' : event.color,
              },
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: '14.28%' as any,
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  pressed: {
    opacity: 0.6,
  },
  dayCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
    fontSize: 11,
    fontWeight: '500',
    color: '#2c3e50',
  },
  outsideMonth: {
    color: '#d5d8dc',
  },
  sundayText: {
    color: '#e74c3c',
  },
  saturdayText: {
    color: '#3498db',
  },
  todayText: {
    fontWeight: '800',
    color: '#3498db',
  },
  todaySundayText: {
    color: '#e74c3c',
  },
  selectedText: {
    color: '#fff',
    fontWeight: '800',
  },
  chipArea: {
    width: '100%',
    paddingHorizontal: 1,
    gap: 2,
  },
  chip: {
    borderLeftWidth: 2,
    borderRadius: 2,
    paddingHorizontal: 3,
    paddingVertical: 1.5,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 13,
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
