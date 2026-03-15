export interface Period {
  period: number;
  startTime: string;
  endTime: string;
}

export interface TimetableSlot {
  subject: string;
  room: string;
  color: string;
}

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface Timetable {
  id: string;
  calendarId: string | null;
  isPublic: boolean;
  slots: Record<string, TimetableSlot>;
}

export type TimetableInput = Omit<Timetable, 'id'>;

export const DEFAULT_PERIODS: Period[] = [
  { period: 1, startTime: '09:00', endTime: '10:30' },
  { period: 2, startTime: '10:40', endTime: '12:10' },
  { period: 3, startTime: '13:00', endTime: '14:30' },
  { period: 4, startTime: '14:40', endTime: '16:10' },
  { period: 5, startTime: '16:20', endTime: '17:50' },
  { period: 6, startTime: '18:00', endTime: '19:30' },
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: '月',
  tue: '火',
  wed: '水',
  thu: '木',
  fri: '金',
  sat: '土',
  sun: '日',
};
