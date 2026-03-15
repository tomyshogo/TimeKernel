import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { CalendarEvent } from '../../types';
import { EventCard } from '../event/EventCard';
import { formatDisplayDate, parseDate } from '../../utils/dateHelpers';

interface Props {
  date: string;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
}

export function DayDetail({ date, events, onEventPress }: Props) {
  const dayEvents = events.filter((e) => e.date === date);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{formatDisplayDate(parseDate(date))}</Text>
      {dayEvents.length === 0 ? (
        <Text style={styles.empty}>予定なし</Text>
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
  empty: {
    color: '#95a5a6',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
