import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DayCell } from './DayCell';
import { CalendarHeader } from './CalendarHeader';
import { getDaysInMonthGrid } from '../../utils/dateHelpers';
import { CalendarEvent } from '../../types';

interface Props {
  currentMonth: Date;
  selectedDate: string;
  events: CalendarEvent[];
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export function MonthView({
  currentMonth,
  selectedDate,
  events,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const days = getDaysInMonthGrid(currentMonth);

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const existing = eventsByDate.get(event.date) || [];
    existing.push(event);
    eventsByDate.set(event.date, existing);
  }

  return (
    <View style={styles.container}>
      <CalendarHeader
        month={currentMonth}
        onPrev={onPrevMonth}
        onNext={onNextMonth}
      />
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <View key={i} style={styles.weekdayCell}>
            <React.Fragment>
              {React.createElement(
                require('react-native').Text,
                {
                  style: [
                    styles.weekdayText,
                    i === 0 && { color: '#e74c3c' },
                    i === 6 && { color: '#3498db' },
                  ],
                },
                label
              )}
            </React.Fragment>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {days.map((day, index) => {
          const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
          return (
            <DayCell
              key={index}
              date={day}
              currentMonth={currentMonth}
              isSelected={dateStr === selectedDate}
              events={eventsByDate.get(dateStr) || []}
              onPress={() => onSelectDate(dateStr)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
});
