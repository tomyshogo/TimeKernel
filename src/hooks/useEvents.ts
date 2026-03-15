import { useEffect, useState } from 'react';
import { CalendarEvent } from '../types';
import { subscribeToEventsByMonth } from '../services/eventService';
import { formatMonth } from '../utils/dateHelpers';

export function useEvents(calendarIds: string[], month: Date) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!calendarIds.length) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    const yearMonth = formatMonth(month);
    const unsubscribes: (() => void)[] = [];
    const eventsMap = new Map<string, CalendarEvent[]>();

    for (const calId of calendarIds) {
      const unsub = subscribeToEventsByMonth(calId, yearMonth, (calEvents) => {
        eventsMap.set(calId, calEvents);
        const allEvents = Array.from(eventsMap.values()).flat();
        allEvents.sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.startTime.localeCompare(b.startTime);
        });
        setEvents(allEvents);
        setIsLoading(false);
      });
      unsubscribes.push(unsub);
    }

    return () => unsubscribes.forEach((u) => u());
  }, [calendarIds.join(','), formatMonth(month)]);

  return { events, isLoading };
}
