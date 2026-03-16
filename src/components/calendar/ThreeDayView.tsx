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
  getThreeDays,
  formatDate,
  formatShortDate,
  isToday,
  parseDate,
} from '../../utils/dateHelpers';

interface Props {
  currentDate: string;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
  onPrev: () => void;
  onNext: () => void;
}

const TIME_LABEL_WIDTH = 44;

export function ThreeDayView({
  currentDate,
  events,
  onEventPress,
  onPrev,
  onNext,
}: Props) {
  const days = getThreeDays(parseDate(currentDate));
  const screenWidth = Dimensions.get('window').width;
  const dayWidth = (screenWidth - TIME_LABEL_WIDTH) / 3;

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrev} style={styles.arrow}>
          <Text style={styles.arrowText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {formatShortDate(days[0])} - {formatShortDate(days[2])}
        </Text>
        <TouchableOpacity onPress={onNext} style={styles.arrow}>
          <Text style={styles.arrowText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* 日付ヘッダー */}
      <View style={styles.dayHeaders}>
        <View style={{ width: TIME_LABEL_WIDTH }} />
        {days.map((day, i) => {
          const today = isToday(day);
          return (
            <View key={i} style={[styles.dayHeader, { width: dayWidth }]}>
              <Text style={[styles.dayNum, today && styles.todayNum]}>
                {formatShortDate(day)}
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
  dayNum: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
  },
  todayNum: {
    color: '#3498db',
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  timeline: {
    flexDirection: 'row',
  },
});
