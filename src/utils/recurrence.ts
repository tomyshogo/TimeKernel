import {
  parseISO,
  addDays,
  addWeeks,
  addMonths,
  format,
  startOfMonth,
  endOfMonth,
  getDay,
} from 'date-fns';
import { CalendarEvent, RecurrenceRule } from '../types';

/**
 * 繰り返しルールに基づいて、指定月のイベントインスタンスを生成する
 */
export function expandRecurringEvents(
  events: CalendarEvent[],
  month: Date
): CalendarEvent[] {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

  const result: CalendarEvent[] = [];

  for (const event of events) {
    if (!event.recurrence) {
      result.push(event);
      continue;
    }

    const rule = event.recurrence;
    const originDate = parseISO(event.date);
    const until = rule.until ? parseISO(rule.until) : monthEnd;
    const effectiveEnd = until < monthEnd ? until : monthEnd;

    const occurrences = generateOccurrences(
      originDate,
      rule,
      monthStart,
      effectiveEnd
    );

    for (const occDate of occurrences) {
      const dateStr = format(occDate, 'yyyy-MM-dd');
      if (dateStr < monthStartStr || dateStr > monthEndStr) continue;

      result.push({
        ...event,
        date: dateStr,
        id: dateStr === event.date ? event.id : `${event.id}_${dateStr}`,
      });
    }
  }

  return result;
}

function generateOccurrences(
  originDate: Date,
  rule: RecurrenceRule,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  const dates: Date[] = [];
  let current = originDate;

  // 最大365日分まで生成（無限ループ防止）
  for (let i = 0; i < 365; i++) {
    if (current > rangeEnd) break;

    if (current >= rangeStart) {
      if (rule.frequency === 'weekly' || rule.frequency === 'biweekly') {
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          if (rule.daysOfWeek.includes(getDay(current))) {
            dates.push(current);
          }
        } else {
          dates.push(current);
        }
      } else {
        dates.push(current);
      }
    }

    current = getNextDate(current, rule);
  }

  return dates;
}

function getNextDate(current: Date, rule: RecurrenceRule): Date {
  switch (rule.frequency) {
    case 'daily':
      return addDays(current, 1);
    case 'weekly':
      return addDays(current, 1); // 日単位でチェック（daysOfWeek対応）
    case 'biweekly':
      return addDays(current, 1); // 日単位でチェック（daysOfWeek対応）
    case 'monthly':
      return addMonths(current, 1);
    case 'custom':
      return addDays(current, rule.interval || 1);
    default:
      return addDays(current, 1);
  }
}
