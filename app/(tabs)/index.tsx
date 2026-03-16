import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MonthView } from '../../src/components/calendar/MonthView';
import { WeekView } from '../../src/components/calendar/WeekView';
import { DayView } from '../../src/components/calendar/DayView';
import { ThreeDayView } from '../../src/components/calendar/ThreeDayView';
import { AgendaView } from '../../src/components/calendar/AgendaView';
import { DayDetail } from '../../src/components/calendar/DayDetail';
import { ViewSwitcher } from '../../src/components/calendar/ViewSwitcher';
import { useCalendars } from '../../src/hooks/useCalendars';
import { useEvents } from '../../src/hooks/useEvents';
import { useTimetables } from '../../src/hooks/useTimetables';
import { useMergedEvents } from '../../src/hooks/useMergedEvents';
import { useUIStore } from '../../src/stores/uiStore';
import {
  addMonths,
  subMonths,
  addDays,
  addWeeks,
  subWeeks,
  formatDate,
  parseDate,
} from '../../src/utils/dateHelpers';
import { CalendarEvent } from '../../src/types';

export default function CalendarScreen() {
  const router = useRouter();
  const { selectedCalendarIds } = useCalendars();
  const {
    selectedDate,
    currentMonth,
    viewType,
    setSelectedDate,
    setCurrentMonth,
    setViewType,
  } = useUIStore();
  const { events: firestoreEvents } = useEvents(selectedCalendarIds, currentMonth);
  const { timetables } = useTimetables();
  const mergedEvents = useMergedEvents(firestoreEvents, timetables, currentMonth);

  const handleEventPress = (event: CalendarEvent) => {
    if (event.id.startsWith('timetable_')) return;
    router.push(`/event/${event.id}?calendarId=${event.calendarId}`);
  };

  const renderView = () => {
    switch (viewType) {
      case 'week':
        return (
          <WeekView
            currentDate={parseDate(selectedDate)}
            events={mergedEvents}
            onEventPress={handleEventPress}
            onPrev={() => {
              const prev = subWeeks(parseDate(selectedDate), 1);
              setSelectedDate(formatDate(prev));
            }}
            onNext={() => {
              const next = addWeeks(parseDate(selectedDate), 1);
              setSelectedDate(formatDate(next));
            }}
          />
        );
      case 'day':
        return (
          <DayView
            currentDate={selectedDate}
            events={mergedEvents}
            onEventPress={handleEventPress}
            onPrev={() => {
              const prev = addDays(parseDate(selectedDate), -1);
              setSelectedDate(formatDate(prev));
            }}
            onNext={() => {
              const next = addDays(parseDate(selectedDate), 1);
              setSelectedDate(formatDate(next));
            }}
          />
        );
      case '3day':
        return (
          <ThreeDayView
            currentDate={selectedDate}
            events={mergedEvents}
            onEventPress={handleEventPress}
            onPrev={() => {
              const prev = addDays(parseDate(selectedDate), -3);
              setSelectedDate(formatDate(prev));
            }}
            onNext={() => {
              const next = addDays(parseDate(selectedDate), 3);
              setSelectedDate(formatDate(next));
            }}
          />
        );
      case 'agenda':
        return (
          <AgendaView
            currentMonth={currentMonth}
            events={mergedEvents}
            onEventPress={handleEventPress}
            onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
            onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
          />
        );
      default:
        return (
          <>
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
          </>
        );
    }
  };

  return (
    <View style={styles.container}>
      <ViewSwitcher current={viewType} onChange={setViewType} />
      <View style={styles.content}>{renderView()}</View>
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
  content: {
    flex: 1,
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
