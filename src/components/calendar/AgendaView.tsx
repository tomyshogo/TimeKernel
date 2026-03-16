import React from 'react';
import { View, Text, SectionList, StyleSheet } from 'react-native';
import { CalendarEvent } from '../../types';
import { EventCard } from '../event/EventCard';
import { formatDisplayDate, parseDate, formatDisplayMonth } from '../../utils/dateHelpers';

interface Props {
  currentMonth: Date;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

interface Section {
  title: string;
  data: CalendarEvent[];
}

export function AgendaView({
  currentMonth,
  events,
  onEventPress,
  onPrevMonth,
  onNextMonth,
}: Props) {
  // 日付ごとにグループ化
  const dateMap = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const existing = dateMap.get(event.date) || [];
    existing.push(event);
    dateMap.set(event.date, existing);
  }

  const sections: Section[] = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      title: formatDisplayDate(parseDate(date)),
      data,
    }));

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text onPress={onPrevMonth} style={styles.arrowText}>
          {'<'}
        </Text>
        <Text style={styles.headerTitle}>
          {formatDisplayMonth(currentMonth)}
        </Text>
        <Text onPress={onNextMonth} style={styles.arrowText}>
          {'>'}
        </Text>
      </View>

      {sections.length === 0 ? (
        <Text style={styles.empty}>今月の予定はありません</Text>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <EventCard event={item} onPress={() => onEventPress(item)} />
            </View>
          )}
          stickySectionHeadersEnabled
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  arrowText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3498db',
    padding: 8,
  },
  sectionHeader: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
  },
  cardWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  empty: {
    color: '#95a5a6',
    textAlign: 'center',
    paddingVertical: 40,
    fontSize: 15,
  },
});
