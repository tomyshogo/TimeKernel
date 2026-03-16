import { Timestamp } from 'firebase/firestore';

export type ExternalCalendarProvider = 'google' | 'apple' | 'outlook' | 'ical';
export type SyncDirection = 'both' | 'import' | 'export';

export interface ExternalCalendar {
  id: string;
  provider: ExternalCalendarProvider;
  name: string;
  color: string;
  syncEnabled: boolean;
  syncDirection: SyncDirection;
  lastSynced: Timestamp | null;
  /** Google/Outlook OAuth トークン（SecureStore に保存） */
  accessToken?: string;
  refreshToken?: string;
  /** iCal URL購読用 */
  icalUrl?: string;
  /** エクスポート対象タイプ */
  exportTypes: ('class' | 'event' | 'shift')[];
  /** Apple Calendar の calendarId (EventKit) */
  appleCalendarId?: string;
  /** Google Calendar の calendarId */
  googleCalendarId?: string;
}

export interface ExternalEventMap {
  id: string;
  externalId: string;
  internalEventId: string;
  calendarId: string;
  provider: ExternalCalendarProvider;
  lastSynced: Timestamp;
}

export const PROVIDER_LABELS: Record<ExternalCalendarProvider, string> = {
  google: 'Google Calendar',
  apple: 'Apple Calendar',
  outlook: 'Outlook',
  ical: 'iCal (URL/ファイル)',
};

export const PROVIDER_COLORS: Record<ExternalCalendarProvider, string> = {
  google: '#4285F4',
  apple: '#FF3B30',
  outlook: '#0078D4',
  ical: '#8E8E93',
};
