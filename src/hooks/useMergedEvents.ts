import { useMemo } from 'react';
import { CalendarEvent, Timetable } from '../types';
import { generateTimetableEvents } from '../utils/timetableHelpers';
import { expandRecurringEvents } from '../utils/recurrence';
import { useAuthStore } from '../stores/authStore';

export function useMergedEvents(
  firestoreEvents: CalendarEvent[],
  timetables: Timetable[],
  month: Date
) {
  const uid = useAuthStore((s) => s.uid);
  const periods = useAuthStore((s) => s.settings.periods);

  const mergedEvents = useMemo(() => {
    if (!uid) return firestoreEvents;

    // 繰り返しイベントを展開
    const expandedEvents = expandRecurringEvents(firestoreEvents, month);

    const timetableEvents = timetables.flatMap((tt) =>
      generateTimetableEvents(
        tt,
        periods,
        month,
        uid,
        tt.calendarId || 'personal'
      )
    );

    return [...expandedEvents, ...timetableEvents].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  }, [firestoreEvents, timetables, month, uid, periods]);

  return mergedEvents;
}
