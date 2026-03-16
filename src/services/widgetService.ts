/**
 * ウィジェットデータ共有サービス
 * アプリからウィジェットにデータを渡す（SharedPreferences / UserDefaults 経由）
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarEvent } from '../types';

const WIDGET_KEYS = {
  todayEvents: 'widget:todayEvents',
  nextEvent: 'widget:nextEvent',
  monthlyShiftSummary: 'widget:monthlyShiftSummary',
  weekEvents: 'widget:weekEvents',
  lastUpdated: 'widget:lastUpdated',
} as const;

export interface WidgetTodayData {
  events: { title: string; startTime: string; endTime: string; color: string }[];
  date: string;
}

export interface WidgetNextEventInfo {
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  minutesUntil: number;
}

export type WidgetNextEventData = WidgetNextEventInfo | null;

export interface WidgetShiftData {
  totalHours: number;
  totalWage: number;
  month: string;
}

export interface WidgetWeekData {
  days: {
    date: string;
    dayLabel: string;
    eventCount: number;
    events: { title: string; color: string }[];
  }[];
}

/**
 * 今日の予定をウィジェットに書き込み
 */
export async function updateTodayWidget(
  events: CalendarEvent[],
  todayStr: string
): Promise<void> {
  const todayEvents = events
    .filter((e) => e.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 5)
    .map((e) => ({
      title: e.title,
      startTime: e.startTime,
      endTime: e.endTime,
      color: e.color,
    }));

  const data: WidgetTodayData = { events: todayEvents, date: todayStr };
  await AsyncStorage.setItem(WIDGET_KEYS.todayEvents, JSON.stringify(data));
  await AsyncStorage.setItem(WIDGET_KEYS.lastUpdated, new Date().toISOString());
}

/**
 * 次の予定をウィジェットに書き込み
 */
export async function updateNextEventWidget(
  events: CalendarEvent[],
  now: Date
): Promise<void> {
  const todayStr = now.toISOString().split('T')[0];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const upcoming = events
    .filter((e) => {
      if (e.date > todayStr) return true;
      if (e.date === todayStr) {
        const [h, m] = e.startTime.split(':').map(Number);
        return h * 60 + m > nowMinutes;
      }
      return false;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

  if (upcoming.length === 0) {
    await AsyncStorage.setItem(WIDGET_KEYS.nextEvent, JSON.stringify(null));
    return;
  }

  const next = upcoming[0];
  const [h, m] = next.startTime.split(':').map(Number);
  const eventDate = new Date(`${next.date}T${next.startTime}:00`);
  const minutesUntil = Math.max(0, Math.round((eventDate.getTime() - now.getTime()) / 60000));

  const data: WidgetNextEventData = {
    title: next.title,
    startTime: next.startTime,
    endTime: next.endTime,
    date: next.date,
    minutesUntil,
  };
  await AsyncStorage.setItem(WIDGET_KEYS.nextEvent, JSON.stringify(data));
}

/**
 * バイト代集計をウィジェットに書き込み
 */
export async function updateShiftWidget(
  totalHours: number,
  totalWage: number,
  month: string
): Promise<void> {
  const data: WidgetShiftData = { totalHours, totalWage, month };
  await AsyncStorage.setItem(WIDGET_KEYS.monthlyShiftSummary, JSON.stringify(data));
}

/**
 * 週間カレンダーデータをウィジェットに書き込み
 */
export async function updateWeekWidget(
  events: CalendarEvent[],
  weekDates: string[],
  dayLabels: string[]
): Promise<void> {
  const days = weekDates.map((date, i) => {
    const dayEvents = events.filter((e) => e.date === date);
    return {
      date,
      dayLabel: dayLabels[i] || '',
      eventCount: dayEvents.length,
      events: dayEvents.slice(0, 3).map((e) => ({ title: e.title, color: e.color })),
    };
  });

  const data: WidgetWeekData = { days };
  await AsyncStorage.setItem(WIDGET_KEYS.weekEvents, JSON.stringify(data));
}

/**
 * 全ウィジェットを一括更新
 */
export async function refreshAllWidgets(
  events: CalendarEvent[],
  shiftHours: number,
  shiftWage: number,
  month: string,
  weekDates: string[],
  dayLabels: string[]
): Promise<void> {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  await Promise.all([
    updateTodayWidget(events, todayStr),
    updateNextEventWidget(events, now),
    updateShiftWidget(shiftHours, shiftWage, month),
    updateWeekWidget(events, weekDates, dayLabels),
  ]);
}
