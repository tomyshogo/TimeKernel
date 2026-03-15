import { useEffect, useState } from 'react';
import { Timetable } from '../types';
import { subscribeToTimetables } from '../services/timetableService';
import { useAuthStore } from '../stores/authStore';

export function useTimetables() {
  const uid = useAuthStore((s) => s.uid);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setTimetables([]);
      setIsLoading(false);
      return;
    }

    const unsub = subscribeToTimetables(uid, (data) => {
      setTimetables(data);
      setIsLoading(false);
    });

    return unsub;
  }, [uid]);

  return { timetables, isLoading };
}
