// Firebase 関連モジュールをモック
jest.mock('../firebase', () => ({
  db: {},
  auth: {},
}));
jest.mock('../eventService', () => ({
  addEvent: jest.fn(),
}));
jest.mock('../externalCalendarService', () => ({
  upsertExternalEventMap: jest.fn(),
  updateSyncTimestamp: jest.fn(),
}));

import { parseICS, generateICS } from '../icalService';
import { CalendarEvent } from '../../types';
import { Timestamp } from 'firebase/firestore';

describe('parseICS', () => {
  it('基本的なVEVENTをパース', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:event1@example.com',
      'SUMMARY:ミーティング',
      'DTSTART:20260401T090000Z',
      'DTEND:20260401T100000Z',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const events = parseICS(ics);
    expect(events).toHaveLength(1);
    expect(events[0].uid).toBe('event1@example.com');
    expect(events[0].summary).toBe('ミーティング');
    expect(events[0].dtstart).toBe('20260401T090000Z');
    expect(events[0].dtend).toBe('20260401T100000Z');
  });

  it('複数イベントをパース', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:e1@test',
      'SUMMARY:イベント1',
      'DTSTART:20260401T090000',
      'DTEND:20260401T100000',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:e2@test',
      'SUMMARY:イベント2',
      'DTSTART:20260402T140000',
      'DTEND:20260402T150000',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const events = parseICS(ics);
    expect(events).toHaveLength(2);
    expect(events[0].summary).toBe('イベント1');
    expect(events[1].summary).toBe('イベント2');
  });

  it('DESCRIPTIONをパース', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:e1@test',
      'SUMMARY:テスト',
      'DTSTART:20260401T090000',
      'DESCRIPTION:備考テキスト',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const events = parseICS(ics);
    expect(events[0].description).toBe('備考テキスト');
  });

  it('必須フィールドが欠けたVEVENTはスキップ', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'SUMMARY:UIDなし',
      'DTSTART:20260401T090000',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:valid@test',
      'SUMMARY:有効',
      'DTSTART:20260401T090000',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const events = parseICS(ics);
    expect(events).toHaveLength(1);
    expect(events[0].uid).toBe('valid@test');
  });

  it('空テキストは空配列', () => {
    expect(parseICS('')).toHaveLength(0);
  });

  it('パラメータ付きDTSTART(TZID)をパース', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:tz@test',
      'SUMMARY:TZ付き',
      'DTSTART;TZID=Asia/Tokyo:20260401T090000',
      'DTEND;TZID=Asia/Tokyo:20260401T100000',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const events = parseICS(ics);
    expect(events).toHaveLength(1);
    expect(events[0].dtstart).toBe('20260401T090000');
  });

  it('値にコロンが含まれる場合も正しくパース', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:colon@test',
      'SUMMARY:10:00 ミーティング',
      'DTSTART:20260401T100000',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const events = parseICS(ics);
    expect(events[0].summary).toBe('10:00 ミーティング');
  });
});

describe('generateICS', () => {
  const makeEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
    id: 'evt1',
    title: 'テスト予定',
    type: 'event',
    date: '2026-04-01',
    startTime: '09:00',
    endTime: '10:00',
    color: '#3498db',
    createdBy: 'user1',
    createdAt: Timestamp.now(),
    calendarId: 'cal1',
    members: ['user1'],
    ...overrides,
  });

  it('VCALENDARヘッダーとフッターを含む', () => {
    const ics = generateICS([]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//TimeKernel//JP');
  });

  it('イベントをVEVENTに変換', () => {
    const ics = generateICS([makeEvent()]);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('SUMMARY:テスト予定');
    expect(ics).toContain('UID:evt1@timekernel.app');
  });

  it('日時をiCal形式に変換', () => {
    const ics = generateICS([makeEvent()]);
    expect(ics).toContain('DTSTART:20260401T090000');
    expect(ics).toContain('DTEND:20260401T100000');
  });

  it('カテゴリにイベントタイプを設定', () => {
    const ics = generateICS([makeEvent({ type: 'shift' })]);
    expect(ics).toContain('CATEGORIES:shift');
  });

  it('複数イベントを出力', () => {
    const events = [
      makeEvent({ id: 'e1', title: 'A' }),
      makeEvent({ id: 'e2', title: 'B' }),
    ];
    const ics = generateICS(events);
    expect(ics).toContain('SUMMARY:A');
    expect(ics).toContain('SUMMARY:B');
  });

  it('空配列でも有効なカレンダー', () => {
    const ics = generateICS([]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).not.toContain('BEGIN:VEVENT');
  });
});
