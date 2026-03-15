import { create } from 'zustand';
import { formatDate } from '../utils/dateHelpers';

interface UIState {
  selectedDate: string;
  currentMonth: Date;
  setSelectedDate: (date: string) => void;
  setCurrentMonth: (month: Date) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedDate: formatDate(new Date()),
  currentMonth: new Date(),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setCurrentMonth: (currentMonth) => set({ currentMonth }),
}));
