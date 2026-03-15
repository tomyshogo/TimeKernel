import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SlotCell } from './SlotCell';
import { Period, DayOfWeek, DAY_LABELS, TimetableSlot } from '../../types';

interface Props {
  periods: Period[];
  slots: Record<string, TimetableSlot>;
  onSlotPress: (dayOfWeek: DayOfWeek, period: number) => void;
}

const DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

export function TimetableGrid({ periods, slots, onSlotPress }: Props) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.periodHeader} />
        {DAYS.map((day) => (
          <View key={day} style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{DAY_LABELS[day]}</Text>
          </View>
        ))}
      </View>
      {periods.map((period) => (
        <View key={period.period} style={styles.row}>
          <View style={styles.periodLabel}>
            <Text style={styles.periodNum}>{period.period}</Text>
            <Text style={styles.periodTime}>{period.startTime}</Text>
          </View>
          {DAYS.map((day) => {
            const key = `${day}_${period.period}`;
            return (
              <SlotCell
                key={key}
                slot={slots[key] || null}
                onPress={() => onSlotPress(day, period.period)}
              />
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  periodHeader: {
    width: 48,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  periodLabel: {
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodNum: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
  },
  periodTime: {
    fontSize: 10,
    color: '#95a5a6',
  },
});
