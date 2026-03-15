import { create } from 'zustand';

interface CalendarState {
  selectedCalendarIds: string[];
  setSelectedCalendarIds: (ids: string[]) => void;
  toggleCalendar: (id: string) => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  selectedCalendarIds: [],
  setSelectedCalendarIds: (ids) => set({ selectedCalendarIds: ids }),
  toggleCalendar: (id) => {
    const current = get().selectedCalendarIds;
    if (current.includes(id)) {
      set({ selectedCalendarIds: current.filter((c) => c !== id) });
    } else {
      set({ selectedCalendarIds: [...current, id] });
    }
  },
}));
