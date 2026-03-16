import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MonthView } from '../../src/components/calendar/MonthView';
import { WeekView } from '../../src/components/calendar/WeekView';
import { DayView } from '../../src/components/calendar/DayView';
import { ThreeDayView } from '../../src/components/calendar/ThreeDayView';
import { AgendaView } from '../../src/components/calendar/AgendaView';
import { DayDetail } from '../../src/components/calendar/DayDetail';
import { ViewSwitcher } from '../../src/components/calendar/ViewSwitcher';
import { QuickInputBar } from '../../src/components/calendar/QuickInputBar';
import { WeatherCard } from '../../src/components/weather/WeatherCard';
import { useEvents } from '../../src/hooks/useEvents';
import { useAuthStore } from '../../src/stores/authStore';
import { useTimetables } from '../../src/hooks/useTimetables';
import { useMergedEvents } from '../../src/hooks/useMergedEvents';
import { useDragAndDrop } from '../../src/hooks/useDragAndDrop';
import { useWeather } from '../../src/hooks/useWeather';
import { useExamSchedules } from '../../src/hooks/useExamSchedules';
import { useUIStore } from '../../src/stores/uiStore';
import { updateEvent, addEvent } from '../../src/services/eventService';
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
import type { ParsedEvent } from '../../src/utils/naturalLanguageParser';

export default function CalendarScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.uid);
  const {
    selectedDate,
    currentMonth,
    viewType,
    setSelectedDate,
    setCurrentMonth,
    setViewType,
  } = useUIStore();
  const weatherSettings = useAuthStore((s) => s.settings.weather);
  const { events: firestoreEvents } = useEvents(uid, currentMonth);
  const { timetables } = useTimetables();
  const { exams: examSchedules } = useExamSchedules();
  const mergedEvents = useMergedEvents(firestoreEvents, timetables, currentMonth, examSchedules);
  const { weather, isLoading: weatherLoading, error: weatherError, refresh: weatherRefresh } = useWeather(weatherSettings);

  const handleEventPress = (event: CalendarEvent) => {
    if (event.id.startsWith('timetable_')) return;
    if (event.id.startsWith('exam_')) {
      const examId = event.id.split('_')[1];
      router.push(`/exam/${examId}`);
      return;
    }
    router.push(`/event/${event.id}?calendarId=${event.calendarId}`);
  };

  const { dragState, handleLongPress, updateDrag, endDrag } = useDragAndDrop({
    onMove: async (eventId, calendarId, newDate, newStartTime, newEndTime) => {
      await updateEvent(calendarId, eventId, {
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
      });
    },
    onCopy: async (event, newDate, newStartTime, newEndTime) => {
      await addEvent(event.calendarId, {
        title: event.title,
        type: event.type,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        color: event.color,
        createdBy: event.createdBy,
      });
    },
  });

  const handleQuickInput = useCallback(
    (parsed: ParsedEvent) => {
      const params = new URLSearchParams({
        date: parsed.date,
        title: parsed.title,
        type: parsed.type,
      });
      if (parsed.startTime) params.set('startTime', parsed.startTime);
      if (parsed.endTime) params.set('endTime', parsed.endTime);
      router.push(`/event/new?${params.toString()}`);
    },
    [router]
  );

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
            enableDrag
            onDragStart={handleLongPress}
            onDragUpdate={(x, y) => updateDrag(x, y, null, null)}
            onDragEnd={endDrag}
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
      <WeatherCard
        weather={weather}
        isLoading={weatherLoading}
        error={weatherError}
        settings={weatherSettings}
        onRefresh={weatherRefresh}
      />
      <QuickInputBar onParsed={handleQuickInput} />
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
