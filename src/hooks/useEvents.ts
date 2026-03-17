import { useEffect, useState } from 'react';
import { CalendarEvent } from '../types';
import { subscribeToEventsByMonth } from '../services/eventService';
import { useAuthStore } from '../stores/authStore';
import { formatMonth } from '../utils/dateHelpers';

/**
 * ユーザーのカレンダーごとにイベントをサブスクライブ。
 * profile.calendars が変わると自動で再購読。
 */
export function useEvents(uid: string | null | undefined, month: Date) {
  const profile = useAuthStore((s) => s.profile);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const calendarIds = profile?.calendars ?? [];
  const yearMonth = formatMonth(month);

  useEffect(() => {
    if (!uid || calendarIds.length === 0) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsub = subscribeToEventsByMonth(calendarIds, yearMonth, (allEvents) => {
      setEvents(allEvents);
      setIsLoading(false);
    });

    return () => unsub();
  }, [uid, yearMonth, calendarIds.join(',')]);

  return { events, isLoading };
}
