import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ja } from 'date-fns/locale';

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatMonth(date: Date): string {
  return format(date, 'yyyy-MM');
}

export function formatDisplayDate(date: Date): string {
  return format(date, 'M月d日(E)', { locale: ja });
}

export function formatDisplayMonth(date: Date): string {
  return format(date, 'yyyy年M月', { locale: ja });
}

export function getDaysInMonthGrid(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function isSameMonth(date1: Date, date2: Date): boolean {
  return format(date1, 'yyyy-MM') === format(date2, 'yyyy-MM');
}

export function parseDate(dateString: string): Date {
  return parseISO(dateString);
}

export function getWeekDays(date: Date): Date[] {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: weekStart, end: weekEnd });
}

export function getThreeDays(date: Date): Date[] {
  return [date, addDays(date, 1), addDays(date, 2)];
}

export function formatWeekRange(date: Date): string {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
  return `${format(weekStart, 'M/d')} - ${format(weekEnd, 'M/d')}`;
}

export function formatShortDate(date: Date): string {
  return format(date, 'M/d(E)', { locale: ja });
}

export { addMonths, subMonths, addDays, addWeeks, subWeeks, getDay, format };
