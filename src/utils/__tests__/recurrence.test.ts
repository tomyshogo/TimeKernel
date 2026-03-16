import { expandRecurringEvents } from '../recurrence';
import { CalendarEvent } from '../../types';
import { Timestamp } from 'firebase/firestore';

const makeEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: 'evt1',
  title: 'テスト予定',
  type: 'event',
  date: '2026-03-01',
  startTime: '10:00',
  endTime: '11:00',
  color: '#3498db',
  createdBy: 'user1',
  createdAt: Timestamp.now(),
  calendarId: 'cal1',
  members: ['user1'],
  ...overrides,
});

const MARCH_2026 = new Date(2026, 2, 1);

describe('expandRecurringEvents', () => {
  describe('繰り返しなしのイベント', () => {
    it('そのまま返す', () => {
      const events = [makeEvent()];
      const result = expandRecurringEvents(events, MARCH_2026);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('evt1');
    });

    it('複数イベントをそのまま返す', () => {
      const events = [
        makeEvent({ id: 'e1', date: '2026-03-05' }),
        makeEvent({ id: 'e2', date: '2026-03-10' }),
      ];
      const result = expandRecurringEvents(events, MARCH_2026);
      expect(result).toHaveLength(2);
    });
  });

  describe('daily繰り返し', () => {
    it('毎日のイベントが月内に展開される', () => {
      const events = [
        makeEvent({
          id: 'daily1',
          date: '2026-03-01',
          recurrence: { frequency: 'daily' },
        }),
      ];
      const result = expandRecurringEvents(events, MARCH_2026);
      // 3月1日〜31日 = 31日分
      expect(result).toHaveLength(31);
    });

    it('月途中からの繰り返し', () => {
      const events = [
        makeEvent({
          id: 'daily2',
          date: '2026-03-15',
          recurrence: { frequency: 'daily' },
        }),
      ];
      const result = expandRecurringEvents(events, MARCH_2026);
      // 3月15日〜31日 = 17日分
      expect(result).toHaveLength(17);
    });

    it('until指定で途中終了', () => {
      const events = [
        makeEvent({
          id: 'daily3',
          date: '2026-03-01',
          recurrence: { frequency: 'daily', until: '2026-03-10' },
        }),
      ];
      const result = expandRecurringEvents(events, MARCH_2026);
      // 3月1日〜10日 = 10日分
      expect(result).toHaveLength(10);
    });
  });

  describe('weekly繰り返し', () => {
    it('daysOfWeek指定で特定曜日のみ', () => {
      const events = [
        makeEvent({
          id: 'weekly1',
          date: '2026-03-01',
          recurrence: {
            frequency: 'weekly',
            daysOfWeek: [1, 3, 5], // 月・水・金
          },
        }),
      ];
      const result = expandRecurringEvents(events, MARCH_2026);
      // 3月の月・水・金は各4〜5回ある
      expect(result.length).toBeGreaterThanOrEqual(12);
      // 全て月・水・金であることを確認
      for (const evt of result) {
        const day = new Date(evt.date).getDay();
        expect([1, 3, 5]).toContain(day);
      }
    });
  });

  describe('monthly繰り返し', () => {
    it('月1回だけ生成', () => {
      const events = [
        makeEvent({
          id: 'monthly1',
          date: '2026-03-15',
          recurrence: { frequency: 'monthly' },
        }),
      ];
      const result = expandRecurringEvents(events, MARCH_2026);
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2026-03-15');
    });
  });

  describe('custom繰り返し', () => {
    it('3日おきに生成', () => {
      const events = [
        makeEvent({
          id: 'custom1',
          date: '2026-03-01',
          recurrence: { frequency: 'custom', interval: 3 },
        }),
      ];
      const result = expandRecurringEvents(events, MARCH_2026);
      // 3/1, 3/4, 3/7, 3/10, 3/13, 3/16, 3/19, 3/22, 3/25, 3/28, 3/31 = 11日
      expect(result).toHaveLength(11);
    });
  });

  describe('IDの生成', () => {
    it('元の日付のイベントは元のIDを保持', () => {
      const events = [
        makeEvent({
          id: 'evt_orig',
          date: '2026-03-01',
          recurrence: { frequency: 'daily', until: '2026-03-03' },
        }),
      ];
      const result = expandRecurringEvents(events, MARCH_2026);
      expect(result[0].id).toBe('evt_orig');
    });

    it('展開されたイベントは日付付きID', () => {
      const events = [
        makeEvent({
          id: 'evt_orig',
          date: '2026-03-01',
          recurrence: { frequency: 'daily', until: '2026-03-03' },
        }),
      ];
      const result = expandRecurringEvents(events, MARCH_2026);
      expect(result[1].id).toBe('evt_orig_2026-03-02');
      expect(result[2].id).toBe('evt_orig_2026-03-03');
    });
  });

  describe('混合イベント', () => {
    it('繰り返しあり/なしの混合', () => {
      const events = [
        makeEvent({ id: 'single', date: '2026-03-05' }),
        makeEvent({
          id: 'recurring',
          date: '2026-03-01',
          recurrence: { frequency: 'daily', until: '2026-03-03' },
        }),
      ];
      const result = expandRecurringEvents(events, MARCH_2026);
      // 単発1 + 繰り返し3 = 4
      expect(result).toHaveLength(4);
    });
  });
});
