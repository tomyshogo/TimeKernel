import { useMemo } from 'react';
import { CalendarEvent } from '../types';

export interface FreeSlot {
  date: string;
  startTime: string;
  endTime: string;
  /** 空いている人数 */
  freeCount: number;
  totalMembers: number;
}

interface UseFreeSlotOptions {
  events: CalendarEvent[];
  /** メンバーUID一覧 */
  memberIds: string[];
  /** 対象日付一覧 (YYYY-MM-DD) */
  dates: string[];
  /** 営業時間開始 (デフォルト 08:00) */
  dayStart?: string;
  /** 営業時間終了 (デフォルト 22:00) */
  dayEnd?: string;
  /** 最小スロット長（分） */
  minSlotMinutes?: number;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * メンバー全員の空き時間帯を計算するフック
 */
export function useFreeSlots({
  events,
  memberIds,
  dates,
  dayStart = '08:00',
  dayEnd = '22:00',
  minSlotMinutes = 30,
}: UseFreeSlotOptions): FreeSlot[] {
  return useMemo(() => {
    if (memberIds.length === 0 || dates.length === 0) return [];

    const startMin = timeToMinutes(dayStart);
    const endMin = timeToMinutes(dayEnd);
    const results: FreeSlot[] = [];

    for (const date of dates) {
      // 各分ごとのビジーカウント配列
      const busyCount = new Array(endMin - startMin).fill(0);

      for (const memberId of memberIds) {
        const memberEvents = events.filter(
          (e) => e.date === date && e.createdBy === memberId
        );
        for (const ev of memberEvents) {
          const evStart = Math.max(timeToMinutes(ev.startTime), startMin) - startMin;
          const evEnd = Math.min(timeToMinutes(ev.endTime), endMin) - startMin;
          for (let i = evStart; i < evEnd; i++) {
            busyCount[i]++;
          }
        }
      }

      // 全員空き（busyCount === 0）の連続区間を抽出
      let slotStart: number | null = null;
      const totalMembers = memberIds.length;

      for (let i = 0; i <= busyCount.length; i++) {
        const isFree = i < busyCount.length && busyCount[i] === 0;
        if (isFree && slotStart === null) {
          slotStart = i;
        } else if (!isFree && slotStart !== null) {
          const durationMin = i - slotStart;
          if (durationMin >= minSlotMinutes) {
            results.push({
              date,
              startTime: minutesToTime(slotStart + startMin),
              endTime: minutesToTime(i + startMin),
              freeCount: totalMembers,
              totalMembers,
            });
          }
          slotStart = null;
        }
      }
    }

    return results;
  }, [events, memberIds, dates, dayStart, dayEnd, minSlotMinutes]);
}
