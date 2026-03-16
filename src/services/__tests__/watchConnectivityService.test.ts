import { buildWatchPayload } from '../watchConnectivityService';
import { CalendarEvent } from '../../types';
import { Timestamp } from 'firebase/firestore';

const TODAY = new Date().toISOString().split('T')[0];

const makeEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: 'evt1',
  title: 'テスト',
  type: 'event',
  date: TODAY,
  startTime: '10:00',
  endTime: '11:00',
  color: '#3498db',
  createdBy: 'user1',
  createdAt: Timestamp.now(),
  calendarId: 'cal1',
  members: ['user1'],
  ...overrides,
});

describe('buildWatchPayload', () => {
  it('基本構造を返す', () => {
    const payload = buildWatchPayload([], 10, 12000);
    expect(payload.events).toEqual([]);
    expect(payload.shiftSummary.totalHours).toBe(10);
    expect(payload.shiftSummary.totalWage).toBe(12000);
    expect(payload.lastUpdated).toBeDefined();
  });

  it('今日のイベントを含む', () => {
    const events = [makeEvent({ title: '今日の予定' })];
    const payload = buildWatchPayload(events, 0, 0);
    expect(payload.events).toHaveLength(1);
    expect(payload.events[0].title).toBe('今日の予定');
  });

  it('3日以上先のイベントは除外', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const events = [
      makeEvent({ id: 'e1', title: '今日', date: TODAY }),
      makeEvent({ id: 'e2', title: '5日後', date: futureDateStr }),
    ];
    const payload = buildWatchPayload(events, 0, 0);
    expect(payload.events).toHaveLength(1);
    expect(payload.events[0].title).toBe('今日');
  });

  it('時間順にソートされる', () => {
    const events = [
      makeEvent({ id: 'e1', title: '午後', startTime: '14:00', endTime: '15:00' }),
      makeEvent({ id: 'e2', title: '午前', startTime: '09:00', endTime: '10:00' }),
    ];
    const payload = buildWatchPayload(events, 0, 0);
    expect(payload.events[0].title).toBe('午前');
    expect(payload.events[1].title).toBe('午後');
  });

  it('必要なフィールドのみ含む', () => {
    const events = [makeEvent()];
    const payload = buildWatchPayload(events, 0, 0);
    const watchEvent = payload.events[0];
    expect(Object.keys(watchEvent).sort()).toEqual(
      ['id', 'title', 'date', 'startTime', 'endTime', 'color', 'type'].sort()
    );
  });

  it('lastUpdatedがISO文字列', () => {
    const payload = buildWatchPayload([], 0, 0);
    expect(() => new Date(payload.lastUpdated)).not.toThrow();
  });
});
