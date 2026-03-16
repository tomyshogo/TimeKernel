import { Timestamp } from 'firebase/firestore';

export type EventType = 'class' | 'event' | 'shift';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  /** custom の場合の間隔（日数） */
  interval?: number;
  /** 繰り返し終了日 (YYYY-MM-DD)。未設定なら無期限 */
  until?: string;
  /** weekly/biweekly の場合に繰り返す曜日 (0=日〜6=土) */
  daysOfWeek?: number[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;
  startTime: string;
  endTime: string;
  hourlyWage?: number;
  color: string;
  createdBy: string;
  createdAt: Timestamp;
  calendarId: string;
  /** カレンダーの members を非正規化（CollectionGroup クエリ + ルール最適化用） */
  members: string[];
  /** 繰り返しルール */
  recurrence?: RecurrenceRule;
  /** サーバー未同期のローカル変更がある場合 true */
  hasPendingWrites?: boolean;
}

export type CalendarEventInput = Omit<CalendarEvent, 'id' | 'createdAt' | 'calendarId' | 'members'>;
