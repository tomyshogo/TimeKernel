import { generateTimetableEvents } from '../timetableHelpers';
import { Period, Timetable } from '../../types';

const PERIODS: Period[] = [
  { period: 1, startTime: '09:00', endTime: '10:30' },
  { period: 2, startTime: '10:40', endTime: '12:10' },
];

const makeTimetable = (
  slots: Record<string, { subject: string; room: string; color: string }>
): Timetable => ({
  id: 'tt1',
  calendarId: 'cal1',
  isPublic: false,
  slots,
});

const MARCH_2026 = new Date(2026, 2, 1);

describe('generateTimetableEvents', () => {
  it('空のスロットはイベントなし', () => {
    const tt = makeTimetable({});
    const events = generateTimetableEvents(tt, PERIODS, MARCH_2026, 'user1', 'cal1');
    expect(events).toHaveLength(0);
  });

  it('月曜1限のスロットが3月の全月曜に展開される', () => {
    const tt = makeTimetable({
      mon_1: { subject: '数学', room: 'A101', color: '#3498db' },
    });
    const events = generateTimetableEvents(tt, PERIODS, MARCH_2026, 'user1', 'cal1');

    // 2026年3月の月曜日: 2, 9, 16, 23, 30 = 5回
    expect(events).toHaveLength(5);
    for (const e of events) {
      expect(e.title).toBe('数学');
      expect(e.startTime).toBe('09:00');
      expect(e.endTime).toBe('10:30');
      expect(e.type).toBe('class');
      expect(new Date(e.date).getDay()).toBe(1); // 月曜
    }
  });

  it('複数曜日・複数時限のスロット', () => {
    const tt = makeTimetable({
      mon_1: { subject: '数学', room: 'A101', color: '#3498db' },
      wed_2: { subject: '英語', room: 'B202', color: '#e74c3c' },
    });
    const events = generateTimetableEvents(tt, PERIODS, MARCH_2026, 'user1', 'cal1');

    // 月曜5回 + 水曜 (4, 11, 18, 25) 4回 = 9イベント
    expect(events).toHaveLength(9);
    const mathEvents = events.filter((e) => e.title === '数学');
    const engEvents = events.filter((e) => e.title === '英語');
    expect(mathEvents).toHaveLength(5);
    expect(engEvents).toHaveLength(4);
  });

  it('IDにtimetable_プレフィックスが付く', () => {
    const tt = makeTimetable({
      mon_1: { subject: '数学', room: 'A101', color: '#3498db' },
    });
    const events = generateTimetableEvents(tt, PERIODS, MARCH_2026, 'user1', 'cal1');
    for (const e of events) {
      expect(e.id).toMatch(/^timetable_/);
    }
  });

  it('色がスロットの色を使用', () => {
    const tt = makeTimetable({
      fri_1: { subject: 'プログラミング', room: 'C303', color: '#2ecc71' },
    });
    const events = generateTimetableEvents(tt, PERIODS, MARCH_2026, 'user1', 'cal1');
    for (const e of events) {
      expect(e.color).toBe('#2ecc71');
    }
  });

  it('日曜のスロットも展開される', () => {
    const tt = makeTimetable({
      sun_1: { subject: '特別講義', room: 'D404', color: '#f39c12' },
    });
    const events = generateTimetableEvents(tt, PERIODS, MARCH_2026, 'user1', 'cal1');
    // 2026年3月の日曜: 1, 8, 15, 22, 29 = 5回
    expect(events).toHaveLength(5);
    for (const e of events) {
      expect(new Date(e.date).getDay()).toBe(0);
    }
  });
});
