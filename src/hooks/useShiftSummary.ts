import { useMemo } from 'react';
import { CalendarEvent } from '../types';
import { calculateMonthlySummary } from '../utils/salary';
import { useAuthStore } from '../stores/authStore';

export function useShiftSummary(events: CalendarEvent[]) {
  const nightShift = useAuthStore((s) => s.settings.nightShift);

  return useMemo(() => {
    const shifts = events
      .filter((e) => e.type === 'shift' && e.hourlyWage)
      .map((e) => ({
        startTime: e.startTime,
        endTime: e.endTime,
        hourlyWage: e.hourlyWage!,
      }));

    return calculateMonthlySummary(shifts, nightShift);
  }, [events, nightShift]);
}
