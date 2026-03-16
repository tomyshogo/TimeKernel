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
import { formatDate, formatDisplayDate, parseDate } from '../../utils/dateHelpers';

interface Props {
  currentDate: string;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function DayView({
  currentDate,
  events,
  onEventPress,
  onPrev,
  onNext,
}: Props) {
  const screenWidth = Dimensions.get('window').width;
  const dayEvents = events.filter((e) => e.date === currentDate);

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrev} style={styles.arrow}>
          <Text style={styles.arrowText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {formatDisplayDate(parseDate(currentDate))}
        </Text>
        <TouchableOpacity onPress={onNext} style={styles.arrow}>
          <Text style={styles.arrowText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* タイムライン */}
      <ScrollView style={styles.scrollArea}>
        <TimelineColumn
          date={parseDate(currentDate)}
          events={dayEvents}
          columnWidth={screenWidth}
          showTimeLabels={true}
          onEventPress={onEventPress}
        />
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
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
  scrollArea: {
    flex: 1,
  },
});
