import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarEvent } from '../../types';
import { EventCard } from '../event/EventCard';
import { formatDisplayDate, parseDate } from '../../utils/dateHelpers';

interface Props {
  date: string;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
}

export function DayDetail({ date, events, onEventPress }: Props) {
  const router = useRouter();
  const dayEvents = events.filter((e) => e.date === date);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{formatDisplayDate(parseDate(date))}</Text>
      {dayEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>予定はありません</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push(`/event/new?date=${date}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>+ 予定を追加</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={dayEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={() => onEventPress(item)} />
          )}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    color: '#95a5a6',
    fontSize: 15,
    marginBottom: 16,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3498db',
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
