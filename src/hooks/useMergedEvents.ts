import { useMemo } from 'react';
import { CalendarEvent, Timetable, ExamSchedule } from '../types';
import { generateTimetableEvents } from '../utils/timetableHelpers';
import { expandRecurringEvents } from '../utils/recurrence';
import { generateExamCalendarEvents } from '../utils/examHelpers';
import { useAuthStore } from '../stores/authStore';

export function useMergedEvents(
  firestoreEvents: CalendarEvent[],
  timetables: Timetable[],
  month: Date,
  examSchedules: ExamSchedule[] = []
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

    // 資格試験イベントを生成
    const examEvents = generateExamCalendarEvents(examSchedules, uid);

    return [...expandedEvents, ...timetableEvents, ...examEvents].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  }, [firestoreEvents, timetables, month, uid, periods, examSchedules]);

  return mergedEvents;
}
