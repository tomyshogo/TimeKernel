import { useMemo } from 'react';
import { CalendarEvent, Timetable } from '../types';
import { generateTimetableEvents } from '../utils/timetableHelpers';
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

    const timetableEvents = timetables.flatMap((tt) =>
      generateTimetableEvents(
        tt,
        periods,
        month,
        uid,
        tt.calendarId || 'personal'
      )
    );

    return [...firestoreEvents, ...timetableEvents].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  }, [firestoreEvents, timetables, month, uid, periods]);

  return mergedEvents;
}
