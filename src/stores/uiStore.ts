import { create } from 'zustand';
import { formatDate } from '../utils/dateHelpers';

export type CalendarViewType = 'month' | 'week' | '3day' | 'day' | 'agenda';

interface UIState {
  selectedDate: string;
  currentMonth: Date;
  viewType: CalendarViewType;
  setSelectedDate: (date: string) => void;
  setCurrentMonth: (month: Date) => void;
  setViewType: (viewType: CalendarViewType) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedDate: formatDate(new Date()),
  currentMonth: new Date(),
  viewType: 'month',
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setCurrentMonth: (currentMonth) => set({ currentMonth }),
  setViewType: (viewType) => set({ viewType }),
}));
