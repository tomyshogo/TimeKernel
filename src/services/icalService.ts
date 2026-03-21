import { CalendarEvent, CalendarEventInput } from '../types';
import { addEvent, updateEvent, getExternalEventIds } from './eventService';
import { updateSyncTimestamp } from './externalCalendarService';
import { ExternalCalendar } from '../types';

// ── iCal パーサー（軽量自前実装）──

interface ICalEvent {
  uid: string;
  summary: string;
  dtstart: string;
  dtend: string;
  description?: string;
}

/**
 * .ics テキストをパースしてイベント配列にする
 */
export function parseICS(icsText: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const lines = icsText.replace(/\r\n /g, '').split(/\r?\n/);

  let current: Partial<ICalEvent> | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
    } else if (line === 'END:VEVENT' && current) {
      if (current.uid && current.summary && current.dtstart) {
        events.push(current as ICalEvent);
      }
      current = null;
    } else if (current) {
      const [key, ...rest] = line.split(':');
      const value = rest.join(':');
      const baseKey = key.split(';')[0];

      switch (baseKey) {
        case 'UID':
          current.uid = value;
          break;
        case 'SUMMARY':
          current.summary = value;
          break;
        case 'DTSTART':
          current.dtstart = value;
          break;
        case 'DTEND':
          current.dtend = value;
          break;
        case 'DESCRIPTION':
          current.description = value;
          break;
      }
    }
  }

  return events;
}

/**
 * iCal日時文字列をDateに変換
 * 形式: 20250401T090000Z or 20250401T090000 or 20250401
 */
function parseICalDateTime(dt: string): Date {
  if (!dt) return new Date();

  // 日付のみの場合
  if (dt.length === 8) {
    return new Date(
      parseInt(dt.slice(0, 4)),
      parseInt(dt.slice(4, 6)) - 1,
      parseInt(dt.slice(6, 8))
    );
  }

  const year = parseInt(dt.slice(0, 4));
  const month = parseInt(dt.slice(4, 6)) - 1;
  const day = parseInt(dt.slice(6, 8));
  const hour = parseInt(dt.slice(9, 11)) || 0;
  const min = parseInt(dt.slice(11, 13)) || 0;

  if (dt.endsWith('Z')) {
    return new Date(Date.UTC(year, month, day, hour, min));
  }
  return new Date(year, month, day, hour, min);
}

/**
 * TimeKernelイベントを.ics形式に変換する
 */
export function generateICS(events: CalendarEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TimeKernel//JP',
    'CALSCALE:GREGORIAN',
  ];

  for (const event of events) {
    const dtstart = formatICalDateTime(event.date, event.startTime);
    const dtend = formatICalDateTime(event.date, event.endTime);

    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@timekernel.app`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${event.title}`,
      `CATEGORIES:${event.type}`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function formatICalDateTime(date: string, time: string): string {
  // date: "2025-04-01", time: "09:00"
  return `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
}

/**
 * .ics テキストからTimeKernelにインポートする
 */
export async function importICSToTimeKernel(
  uid: string,
  icsText: string,
  targetCalendarId: string,
  externalCal: ExternalCalendar
): Promise<number> {
  const icalEvents = parseICS(icsText);
  let importedCount = 0;

  // イベントドキュメント自体から externalId で重複チェック
  const existingMap = await getExternalEventIds(targetCalendarId, 'ical');

  for (const ie of icalEvents) {
    const startDt = parseICalDateTime(ie.dtstart);
    const endDt = ie.dtend ? parseICalDateTime(ie.dtend) : new Date(startDt.getTime() + 3600000);

    const date = startDt.toISOString().split('T')[0];
    const startTime = `${String(startDt.getHours()).padStart(2, '0')}:${String(startDt.getMinutes()).padStart(2, '0')}`;
    const endTime = `${String(endDt.getHours()).padStart(2, '0')}:${String(endDt.getMinutes()).padStart(2, '0')}`;

    const eventData: CalendarEventInput = {
      title: ie.summary || '(タイトルなし)',
      type: 'event',
      date,
      startTime,
      endTime,
      color: externalCal.color,
      createdBy: uid,
      externalId: ie.uid,
      externalProvider: 'ical',
    };

    const existingEventId = existingMap.get(ie.uid);
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
 * iCal URLからイベントをフェッチしてインポートする
 */
export async function syncICalUrlToTimeKernel(
  uid: string,
  externalCal: ExternalCalendar,
  targetCalendarId: string
): Promise<number> {
  if (!externalCal.icalUrl) return 0;

  const res = await fetch(externalCal.icalUrl);
  if (!res.ok) throw new Error(`iCal fetch error: ${res.status}`);

  const icsText = await res.text();
  return importICSToTimeKernel(uid, icsText, targetCalendarId, externalCal);
}
