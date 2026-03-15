import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MonthView } from '../../src/components/calendar/MonthView';
import { DayDetail } from '../../src/components/calendar/DayDetail';
import { useCalendars } from '../../src/hooks/useCalendars';
import { useEvents } from '../../src/hooks/useEvents';
import { useTimetables } from '../../src/hooks/useTimetables';
import { useMergedEvents } from '../../src/hooks/useMergedEvents';
import { useUIStore } from '../../src/stores/uiStore';
import { addMonths, subMonths } from '../../src/utils/dateHelpers';
import { CalendarEvent } from '../../src/types';

export default function CalendarScreen() {
  const router = useRouter();
  const { selectedCalendarIds } = useCalendars();
  const { selectedDate, currentMonth, setSelectedDate, setCurrentMonth } =
    useUIStore();
  const { events: firestoreEvents } = useEvents(selectedCalendarIds, currentMonth);
  const { timetables } = useTimetables();
  const mergedEvents = useMergedEvents(firestoreEvents, timetables, currentMonth);

  const handleEventPress = (event: CalendarEvent) => {
    if (event.id.startsWith('timetable_')) return;
    router.push(`/event/${event.id}?calendarId=${event.calendarId}`);
  };

  return (
    <View style={styles.container}>
      <MonthView
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        events={mergedEvents}
        onSelectDate={setSelectedDate}
        onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
        onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
      />
      <View style={styles.detail}>
        <DayDetail
          date={selectedDate}
          events={mergedEvents}
          onEventPress={handleEventPress}
        />
      </View>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/event/new?date=${selectedDate}`)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  detail: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
});
