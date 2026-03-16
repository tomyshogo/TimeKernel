import { ExternalCalendar } from '../types';
import { getExternalCalendars } from './externalCalendarService';
import { syncGoogleToTimeKernel } from './googleCalendarService';
import { syncAppleToTimeKernel } from './appleCalendarService';
import { syncICalUrlToTimeKernel } from './icalService';

export interface SyncResult {
  calendarName: string;
  provider: string;
  importedCount: number;
  error?: string;
}

/**
 * すべての外部カレンダーを同期する
 */
export async function syncAllExternalCalendars(
  uid: string,
  defaultCalendarId: string
): Promise<SyncResult[]> {
  const externalCalendars = await getExternalCalendars(uid);
  const results: SyncResult[] = [];

  for (const cal of externalCalendars) {
    if (!cal.syncEnabled) continue;

    try {
      const count = await syncSingleCalendar(uid, cal, defaultCalendarId);
      results.push({
        calendarName: cal.name,
        provider: cal.provider,
        importedCount: count,
      });
    } catch (error: any) {
      results.push({
        calendarName: cal.name,
        provider: cal.provider,
        importedCount: 0,
        error: error.message || '同期に失敗しました',
      });
    }
  }

  return results;
}

/**
 * 単一の外部カレンダーを同期する
 */
export async function syncSingleCalendar(
  uid: string,
  cal: ExternalCalendar,
  targetCalendarId: string
): Promise<number> {
  const direction = cal.syncDirection;
  if (direction === 'export') return 0; // エクスポートのみの場合スキップ

  switch (cal.provider) {
    case 'google':
      return syncGoogleToTimeKernel(uid, cal, targetCalendarId);
    case 'apple':
      return syncAppleToTimeKernel(uid, cal, targetCalendarId);
    case 'ical':
      return syncICalUrlToTimeKernel(uid, cal, targetCalendarId);
    case 'outlook':
      // Outlook は Google と同様の構造で実装予定
      return 0;
    default:
      return 0;
  }
}
