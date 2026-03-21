import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Alert, Modal, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MonthView } from '../../src/components/calendar/MonthView';
import { WeekView } from '../../src/components/calendar/WeekView';
import { DayView } from '../../src/components/calendar/DayView';
import { ThreeDayView } from '../../src/components/calendar/ThreeDayView';
import { AgendaView } from '../../src/components/calendar/AgendaView';
import { DayDetail } from '../../src/components/calendar/DayDetail';
import { ViewSwitcher } from '../../src/components/calendar/ViewSwitcher';
import { DashboardSummary } from '../../src/components/dashboard/DashboardSummary';
import { useEvents } from '../../src/hooks/useEvents';
import { useAuthStore } from '../../src/stores/authStore';
import { useTimetables } from '../../src/hooks/useTimetables';
import { useMergedEvents } from '../../src/hooks/useMergedEvents';
import { useExamSchedules } from '../../src/hooks/useExamSchedules';
import { useExternalCalendarSync } from '../../src/hooks/useExternalCalendarSync';
import { useUIStore } from '../../src/stores/uiStore';
import { addEvent, deleteEvent } from '../../src/services/eventService';
import { cancelEventNotifications } from '../../src/services/notificationService';
import { useCalendars } from '../../src/hooks/useCalendars';
import { QuickEventSheet } from '../../src/components/event/QuickEventSheet';
import { SmartInputBar } from '../../src/components/calendar/SmartInputBar';
import { scheduleEventReminder } from '../../src/services/notificationService';
import { ParsedEvent } from '../../src/services/naturalLanguageParser';
import { CalendarEventInput } from '../../src/types';
import { EVENT_COLORS } from '../../src/utils/constants';
import {
  addMonths,
  subMonths,
  addDays,
  addWeeks,
  subWeeks,
  formatDate,
  formatDisplayDate,
  parseDate,
} from '../../src/utils/dateHelpers';
import { CalendarEvent } from '../../src/types';

export default function CalendarScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.uid);
  const {
    selectedDate,
    currentMonth,
    viewType,
    showTimetable,
    setSelectedDate,
    setCurrentMonth,
    setViewType,
    setShowTimetable,
  } = useUIStore();
  useExternalCalendarSync();
  const { events: allEvents } = useEvents(uid, currentMonth);
  const { calendars, selectedCalendarIds } = useCalendars();
  const filteredEvents = useMemo(() => {
    if (selectedCalendarIds.length === 0) return allEvents;
    return allEvents.filter((e) => selectedCalendarIds.includes(e.calendarId));
  }, [allEvents, selectedCalendarIds]);
  const { timetables } = useTimetables();
  const { exams: examSchedules } = useExamSchedules();
  const mergedEvents = useMergedEvents(filteredEvents, showTimetable ? timetables : [], currentMonth, examSchedules);
  const notifSettings = useAuthStore((s) => s.settings.notifications);
  const [showQuickSheet, setShowQuickSheet] = useState(false);
  const [dayDetailVisible, setDayDetailVisible] = useState(false);
  const lastTapRef = useRef<{ date: string; time: number }>({ date: '', time: 0 });

  const handleSelectDate = useCallback((date: string) => {
    const now = Date.now();
    const last = lastTapRef.current;
    if (last.date === date && now - last.time < 400) {
      // ダブルタップ → 詳細モーダル
      setDayDetailVisible(true);
      lastTapRef.current = { date: '', time: 0 };
    } else {
      // シングルタップ → 選択のみ
      setSelectedDate(date);
      lastTapRef.current = { date, time: now };
    }
  }, [setSelectedDate]);

  const handleQuickEventSubmit = useCallback(
    async (calendarId: string, event: CalendarEventInput) => {
      const eventId = await addEvent(calendarId, event);
      if (notifSettings?.enabled) {
        await scheduleEventReminder(
          { ...event, id: eventId, calendarId, members: [], createdAt: null as any },
          notifSettings.reminderMinutes,
          notifSettings
        );
      }
    },
    [notifSettings]
  );

  const handleSmartInput = useCallback(
    async (parsed: ParsedEvent) => {
      const calId = selectedCalendarIds[0] || calendars[0]?.id;
      if (!calId || !uid) return;

      const type = parsed.type ?? 'event';
      const color = EVENT_COLORS[type];
      const datesToCreate = parsed.dates ?? [parsed.date];

      for (const d of datesToCreate) {
        const event: CalendarEventInput = {
          title: parsed.title,
          type,
          date: d,
          startTime: parsed.startTime ?? '09:00',
          endTime: parsed.endTime ?? '10:00',
          color,
          createdBy: uid,
          ...(parsed.recurrence && !parsed.dates ? { recurrence: parsed.recurrence } : {}),
        };
        const eventId = await addEvent(calId, event);
        if (notifSettings?.enabled) {
          await scheduleEventReminder(
            { ...event, id: eventId, calendarId: calId, members: [], createdAt: null as any },
            notifSettings.reminderMinutes,
            notifSettings
          );
        }
      }
    },
    [uid, selectedCalendarIds, calendars, notifSettings]
  );

  const handleEventPress = (event: CalendarEvent) => {
    if (event.id.startsWith('timetable_')) return;
    if (event.id.startsWith('exam_')) return;
    router.push(`/event/${event.id}?calendarId=${event.calendarId}`);
  };

  const handleDeleteEvent = useCallback(
    async (event: CalendarEvent) => {
      await cancelEventNotifications(event.id);
      await deleteEvent(event.calendarId, event.id);
    },
    []
  );

  const handleSmartDelete = useCallback(
    async (parsed: ParsedEvent) => {
      const targetDates = parsed.dates ?? [parsed.date];
      const titleLower = parsed.title.toLowerCase();

      // 対象イベントを検索
      const matchingEvents = mergedEvents.filter((e) => {
        if (e.id.startsWith('timetable_') || e.id.startsWith('exam_')) return false;
        const titleMatch = e.title.toLowerCase().includes(titleLower);
        const dateMatch = targetDates.includes(e.date);
        return titleMatch && dateMatch;
      });

      if (matchingEvents.length === 0) {
        Alert.alert('該当なし', `「${parsed.title}」に一致する予定が見つかりませんでした`);
        return;
      }

      Alert.alert(
        '予定を削除',
        `「${parsed.title}」を含む${matchingEvents.length}件の予定を削除しますか？`,
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: `${matchingEvents.length}件を削除`,
            style: 'destructive',
            onPress: async () => {
              for (const ev of matchingEvents) {
                await cancelEventNotifications(ev.id);
                await deleteEvent(ev.calendarId, ev.id);
              }
              Alert.alert('削除完了', `${matchingEvents.length}件の予定を削除しました`);
            },
          },
        ]
      );
    },
    [mergedEvents]
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
        return null;
    }
  };

  const isMonthView = viewType === 'month';

  return (
    <View style={styles.container}>
      <DashboardSummary uid={uid} events={mergedEvents} selectedDate={selectedDate} />
      {uid && calendars.length > 0 && (
        <SmartInputBar onSubmit={handleSmartInput} onDelete={handleSmartDelete} />
      )}
      <ViewSwitcher current={viewType} onChange={setViewType} />
      {isMonthView ? (
        <MonthView
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          events={mergedEvents}
          onSelectDate={handleSelectDate}
          onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
          onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
          onChangeMonth={setCurrentMonth}
          showTimetable={showTimetable}
          onToggleTimetable={() => setShowTimetable(!showTimetable)}
        />
      ) : (
        <View style={styles.content}>{renderView()}</View>
      )}

      {/* 日付詳細モーダル */}
      <Modal visible={dayDetailVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setDayDetailVisible(false)}>
        <SafeAreaView style={styles.dayModalContainer}>
          <View style={styles.dayModalHeader}>
            <TouchableOpacity onPress={() => setDayDetailVisible(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color="#2c3e50" />
            </TouchableOpacity>
            <Text style={styles.dayModalTitle}>{formatDisplayDate(parseDate(selectedDate))}</Text>
            <TouchableOpacity onPress={() => { setDayDetailVisible(false); router.push(`/event/new?date=${selectedDate}`); }} hitSlop={8}>
              <Ionicons name="add" size={24} color="#3498db" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.dayModalScroll} contentContainerStyle={styles.dayModalContent}>
            <DayDetail
              date={selectedDate}
              events={mergedEvents}
              onEventPress={(event) => { setDayDetailVisible(false); handleEventPress(event); }}
              onDeleteEvent={handleDeleteEvent}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
      {!showQuickSheet && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowQuickSheet(true)}
          onLongPress={() => router.push(`/event/new?date=${selectedDate}`)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
      {uid && calendars.length > 0 && (
        <QuickEventSheet
          visible={showQuickSheet}
          onClose={() => setShowQuickSheet(false)}
          onSubmit={handleQuickEventSubmit}
          calendarId={selectedCalendarIds[0] || calendars[0].id}
          uid={uid}
          initialDate={selectedDate}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  content: {
    flex: 1,
  },
  dayModalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  dayModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  dayModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2c3e50',
  },
  dayModalScroll: {
    flex: 1,
  },
  dayModalContent: {
    paddingBottom: 40,
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
