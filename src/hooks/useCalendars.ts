import { useEffect, useState } from 'react';
import { Calendar } from '../types';
import { subscribeToCalendar } from '../services/calendarService';
import { useAuthStore } from '../stores/authStore';
import { useCalendarStore } from '../stores/calendarStore';

export function useCalendars() {
  const profile = useAuthStore((s) => s.profile);
  const { selectedCalendarIds, setSelectedCalendarIds } = useCalendarStore();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile?.calendars.length) {
      setCalendars([]);
      setIsLoading(false);
      return;
    }

    const unsubscribes: (() => void)[] = [];
    const calMap = new Map<string, Calendar>();

    for (const calId of profile.calendars) {
      const unsub = subscribeToCalendar(calId, (cal) => {
        if (cal) {
          calMap.set(calId, cal);
        } else {
          calMap.delete(calId);
        }
        setCalendars(Array.from(calMap.values()));
        setIsLoading(false);
      });
      unsubscribes.push(unsub);
    }

    if (selectedCalendarIds.length === 0 && profile.calendars.length > 0) {
      setSelectedCalendarIds(profile.calendars);
    }

    return () => unsubscribes.forEach((u) => u());
  }, [profile?.calendars]);

  return { calendars, isLoading, selectedCalendarIds };
}
