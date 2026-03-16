import { EVENT_COLORS, CALENDAR_COLORS, EVENT_TYPE_LABELS } from '../constants';

describe('EVENT_COLORS', () => {
  it('3タイプ全てに色が定義', () => {
    expect(EVENT_COLORS.class).toBeDefined();
    expect(EVENT_COLORS.event).toBeDefined();
    expect(EVENT_COLORS.shift).toBeDefined();
  });

  it('全て有効なHEXカラー', () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    expect(EVENT_COLORS.class).toMatch(hexRegex);
    expect(EVENT_COLORS.event).toMatch(hexRegex);
    expect(EVENT_COLORS.shift).toMatch(hexRegex);
  });
});

describe('CALENDAR_COLORS', () => {
  it('24色パレット', () => {
    expect(CALENDAR_COLORS).toHaveLength(24);
  });

  it('全て有効なHEXカラー', () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    for (const color of CALENDAR_COLORS) {
      expect(color).toMatch(hexRegex);
    }
  });

  it('重複なし', () => {
    const unique = new Set(CALENDAR_COLORS);
    expect(unique.size).toBe(CALENDAR_COLORS.length);
  });
});

describe('EVENT_TYPE_LABELS', () => {
  it('3タイプの日本語ラベル', () => {
    expect(EVENT_TYPE_LABELS.class).toBe('授業');
    expect(EVENT_TYPE_LABELS.event).toBe('予定');
    expect(EVENT_TYPE_LABELS.shift).toBe('バイト');
  });
});
