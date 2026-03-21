import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { CalendarEventInput, ExternalCalendar } from '../types';
import { addEvent, updateEvent, getExternalEventIds } from './eventService';
import { updateSyncTimestamp } from './externalCalendarService';

/**
 * カレンダー権限を要求する
 */
export async function requestCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

/**
 * デバイス上のカレンダー一覧を取得する
 */
export async function fetchDeviceCalendars(): Promise<
  { id: string; title: string; color: string; source: string }[]
> {
  const granted = await requestCalendarPermissions();
  if (!granted) return [];

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return calendars.map((cal) => ({
    id: cal.id,
    title: cal.title,
    color: cal.color || '#FF3B30',
    source: cal.source?.name || 'Unknown',
  }));
}

/**
 * Apple Calendar のイベントを取得する（指定期間）
 */
export async function fetchAppleCalendarEvents(
  calendarId: string,
  startDate: Date,
  endDate: Date
): Promise<Calendar.Event[]> {
  const granted = await requestCalendarPermissions();
  if (!granted) return [];

  return Calendar.getEventsAsync([calendarId], startDate, endDate);
}

/**
 * Apple Calendar にイベントを作成する
 */
export async function createAppleCalendarEvent(
  calendarId: string,
  event: { title: string; startDate: Date; endDate: Date }
): Promise<string> {
  return Calendar.createEventAsync(calendarId, {
    title: event.title,
    startDate: event.startDate,
    endDate: event.endDate,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}

/**
 * Apple Calendar のイベントをTimeKernelにインポートする
 */
export async function syncAppleToTimeKernel(
  uid: string,
  externalCal: ExternalCalendar,
  targetCalendarId: string
): Promise<number> {
  if (!externalCal.appleCalendarId) return 0;

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 4, 0);

  const appleEvents = await fetchAppleCalendarEvents(
    externalCal.appleCalendarId,
    startDate,
    endDate
  );

  // イベントドキュメント自体から externalId で重複チェック
  const existingMap = await getExternalEventIds(targetCalendarId, 'apple');

  let importedCount = 0;
  for (const ae of appleEvents) {
    const startDt = new Date(ae.startDate);
    const endDt = new Date(ae.endDate);

    const date = startDt.toISOString().split('T')[0];
    const startTime = `${String(startDt.getHours()).padStart(2, '0')}:${String(startDt.getMinutes()).padStart(2, '0')}`;
    const endTime = `${String(endDt.getHours()).padStart(2, '0')}:${String(endDt.getMinutes()).padStart(2, '0')}`;

    const eventData: CalendarEventInput = {
      title: ae.title || '(タイトルなし)',
      type: 'event',
      date,
      startTime,
      endTime,
      color: externalCal.color,
      createdBy: uid,
      externalId: ae.id,
      externalProvider: 'apple',
    };

    const existingEventId = existingMap.get(ae.id);
    if (existingEventId) {
      await updateEvent(targetCalendarId, existingEventId, eventData);
    } else {
      await addEvent(targetCalendarId, eventData);
      importedCount++;
    }
  }

  await updateSyncTimestamp(uid, externalCal.id);
  return importedCount;
}

/**
 * TimeKernelイベントをApple Calendarにエクスポートする
 */
export async function exportToAppleCalendar(
  appleCalendarId: string,
  event: { title: string; date: string; startTime: string; endTime: string }
): Promise<string | null> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;

  const granted = await requestCalendarPermissions();
  if (!granted) return null;

  const startDate = new Date(`${event.date}T${event.startTime}:00`);
  const endDate = new Date(`${event.date}T${event.endTime}:00`);

  return createAppleCalendarEvent(appleCalendarId, {
    title: event.title,
    startDate,
    endDate,
  });
}
