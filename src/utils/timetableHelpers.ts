import { CalendarEvent, DayOfWeek, Period, Timetable } from '../types';
import { eachDayOfInterval, getDay, startOfMonth, endOfMonth } from 'date-fns';
import { formatDate } from './dateHelpers';
import { Timestamp } from 'firebase/firestore';

const DAY_INDEX_MAP: Record<number, DayOfWeek> = {
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
  0: 'sun',
};

export function generateTimetableEvents(
  timetable: Timetable,
  periods: Period[],
  month: Date,
  uid: string,
  calendarId: string
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });

  for (const day of days) {
    const dayOfWeek = DAY_INDEX_MAP[getDay(day)];
    if (!dayOfWeek) continue;

    for (const period of periods) {
      const slotKey = `${dayOfWeek}_${period.period}`;
      const slot = timetable.slots[slotKey];
      if (!slot) continue;

      events.push({
        id: `timetable_${timetable.id}_${formatDate(day)}_${period.period}`,
        title: slot.subject,
        type: 'class',
        date: formatDate(day),
        startTime: period.startTime,
        endTime: period.endTime,
        color: slot.color,
        createdBy: uid,
        createdAt: Timestamp.now(),
        calendarId,
        members: [uid],
      });
    }
  }

  return events;
}
