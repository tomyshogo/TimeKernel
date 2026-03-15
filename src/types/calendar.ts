import { Timestamp } from 'firebase/firestore';

export interface Calendar {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
  createdAt: Timestamp;
}

export type CalendarInput = Omit<Calendar, 'id' | 'createdAt'>;
