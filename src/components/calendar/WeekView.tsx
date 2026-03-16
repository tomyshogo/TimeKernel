import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { CalendarEvent } from '../../types';
import { TimelineColumn } from './TimelineColumn';
import {
  getWeekDays,
  formatDate,
  formatWeekRange,
  isToday,
} from '../../utils/dateHelpers';

interface Props {
  currentDate: Date;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
  onPrev: () => void;
  onNext: () => void;
}

const TIME_LABEL_WIDTH = 44;

export function WeekView({
  currentDate,
  events,
  onEventPress,
  onPrev,
  onNext,
}: Props) {
  const days = getWeekDays(currentDate);
  const screenWidth = Dimensions.get('window').width;
  const dayWidth = (screenWidth - TIME_LABEL_WIDTH) / 7;

  const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrev} style={styles.arrow}>
          <Text style={styles.arrowText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{formatWeekRange(currentDate)}</Text>
        <TouchableOpacity onPress={onNext} style={styles.arrow}>
          <Text style={styles.arrowText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* 曜日ヘッダー */}
      <View style={styles.dayHeaders}>
        <View style={{ width: TIME_LABEL_WIDTH }} />
        {days.map((day, i) => {
          const today = isToday(day);
          return (
            <View key={i} style={[styles.dayHeader, { width: dayWidth }]}>
              <Text
                style={[
                  styles.dayLabel,
                  i === 0 && { color: '#e74c3c' },
                  i === 6 && { color: '#3498db' },
                ]}
              >
                {WEEKDAY_LABELS[i]}
              </Text>
              <Text style={[styles.dayNum, today && styles.todayNum]}>
                {day.getDate()}
              </Text>
            </View>
          );
        })}
      </View>

      {/* タイムライン */}
      <ScrollView style={styles.scrollArea}>
        <View style={styles.timeline}>
          {days.map((day, i) => {
            const dateStr = formatDate(day);
            const dayEvents = events.filter((e) => e.date === dateStr);
            return (
              <TimelineColumn
                key={i}
                date={day}
                events={dayEvents}
                columnWidth={i === 0 ? dayWidth + TIME_LABEL_WIDTH : dayWidth}
                showTimeLabels={i === 0}
                onEventPress={onEventPress}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  arrow: {
    padding: 8,
  },
  arrowText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3498db',
  },
  dayHeaders: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 6,
  },
  dayHeader: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  dayNum: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 2,
  },
  todayNum: {
    color: '#fff',
    backgroundColor: '#3498db',
    borderRadius: 12,
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
    overflow: 'hidden',
  },
  scrollArea: {
    flex: 1,
  },
  timeline: {
    flexDirection: 'row',
  },
});
