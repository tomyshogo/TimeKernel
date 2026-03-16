import { useEffect, useState } from 'react';
import { CalendarEvent } from '../types';
import { subscribeToEventsByMonth } from '../services/eventService';
import { formatMonth } from '../utils/dateHelpers';

/**
 * CollectionGroup クエリで全カレンダーのイベントを1本のリスナーで取得。
 * カレンダー数に関わらずリスナーは常に1本。
 */
export function useEvents(uid: string | null | undefined, month: Date) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    const yearMonth = formatMonth(month);
    setIsLoading(true);

    const unsub = subscribeToEventsByMonth(uid, yearMonth, (allEvents) => {
      setEvents(allEvents);
      setIsLoading(false);
    });

    return () => unsub();
  }, [uid, formatMonth(month)]);

  return { events, isLoading };
}
