import { Timestamp } from 'firebase/firestore';

export type EventType = 'class' | 'event' | 'shift';

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
  /** サーバー未同期のローカル変更がある場合 true */
  hasPendingWrites?: boolean;
}

export type CalendarEventInput = Omit<CalendarEvent, 'id' | 'createdAt' | 'calendarId'>;
