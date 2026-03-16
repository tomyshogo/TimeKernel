import {
  formatDate,
  formatMonth,
  formatDisplayDate,
  formatDisplayMonth,
  getDaysInMonthGrid,
  isToday,
  isSameMonth,
  parseDate,
  getWeekDays,
  getThreeDays,
  formatWeekRange,
  formatShortDate,
} from '../dateHelpers';

describe('formatDate', () => {
  it('yyyy-MM-dd形式でフォーマット', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('月・日が1桁でもゼロ埋め', () => {
    expect(formatDate(new Date(2026, 2, 1))).toBe('2026-03-01');
  });

  it('12月31日', () => {
    expect(formatDate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('formatMonth', () => {
  it('yyyy-MM形式でフォーマット', () => {
    expect(formatMonth(new Date(2026, 0, 1))).toBe('2026-01');
  });

  it('12月', () => {
    expect(formatMonth(new Date(2026, 11, 15))).toBe('2026-12');
  });
});

describe('formatDisplayDate', () => {
  it('日本語の曜日付きでフォーマット', () => {
    // 2026-03-16 は月曜日
    const result = formatDisplayDate(new Date(2026, 2, 16));
    expect(result).toBe('3月16日(月)');
  });

  it('日曜日', () => {
    // 2026-03-15 は日曜日
    const result = formatDisplayDate(new Date(2026, 2, 15));
    expect(result).toBe('3月15日(日)');
  });
});

describe('formatDisplayMonth', () => {
  it('yyyy年M月形式でフォーマット', () => {
    expect(formatDisplayMonth(new Date(2026, 0, 1))).toBe('2026年1月');
  });

  it('12月', () => {
    expect(formatDisplayMonth(new Date(2026, 11, 1))).toBe('2026年12月');
  });
});

describe('getDaysInMonthGrid', () => {
  it('カレンダーグリッドは7の倍数', () => {
    const days = getDaysInMonthGrid(new Date(2026, 2, 1)); // 3月
    expect(days.length % 7).toBe(0);
  });

  it('最低28日（4週間）以上', () => {
    const days = getDaysInMonthGrid(new Date(2026, 1, 1)); // 2月
    expect(days.length).toBeGreaterThanOrEqual(28);
  });

  it('日曜始まり', () => {
    const days = getDaysInMonthGrid(new Date(2026, 2, 1));
    expect(days[0].getDay()).toBe(0); // 日曜
  });

  it('月の1日を含む', () => {
    const days = getDaysInMonthGrid(new Date(2026, 2, 1));
    const hasFirst = days.some(
      (d) => d.getDate() === 1 && d.getMonth() === 2 && d.getFullYear() === 2026
    );
    expect(hasFirst).toBe(true);
  });
});

describe('isToday', () => {
  it('今日の日付はtrue', () => {
    expect(isToday(new Date())).toBe(true);
  });

  it('昨日の日付はfalse', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday)).toBe(false);
  });
});

describe('isSameMonth', () => {
  it('同じ月はtrue', () => {
    expect(isSameMonth(new Date(2026, 2, 1), new Date(2026, 2, 31))).toBe(true);
  });

  it('違う月はfalse', () => {
    expect(isSameMonth(new Date(2026, 2, 1), new Date(2026, 3, 1))).toBe(false);
  });

  it('違う年の同じ月はfalse', () => {
    expect(isSameMonth(new Date(2025, 2, 1), new Date(2026, 2, 1))).toBe(false);
  });
});

describe('parseDate', () => {
  it('yyyy-MM-dd文字列をDateに変換', () => {
    const date = parseDate('2026-03-16');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(16);
  });
});

describe('getWeekDays', () => {
  it('7日間を返す', () => {
    const days = getWeekDays(new Date(2026, 2, 16));
    expect(days).toHaveLength(7);
  });

  it('日曜始まり', () => {
    const days = getWeekDays(new Date(2026, 2, 18)); // 水曜
    expect(days[0].getDay()).toBe(0);
  });

  it('土曜終わり', () => {
    const days = getWeekDays(new Date(2026, 2, 18));
    expect(days[6].getDay()).toBe(6);
  });
});

describe('getThreeDays', () => {
  it('3日間を返す', () => {
    const days = getThreeDays(new Date(2026, 2, 16));
    expect(days).toHaveLength(3);
  });

  it('連続する3日', () => {
    const days = getThreeDays(new Date(2026, 2, 16));
    expect(days[0].getDate()).toBe(16);
    expect(days[1].getDate()).toBe(17);
    expect(days[2].getDate()).toBe(18);
  });
});

describe('formatWeekRange', () => {
  it('週の範囲を表示（M/d - M/d）', () => {
    // 2026-03-16は月曜 → 週は3/15(日)〜3/21(土)
    const result = formatWeekRange(new Date(2026, 2, 16));
    expect(result).toBe('3/15 - 3/21');
  });
});

describe('formatShortDate', () => {
  it('M/d(E)形式で曜日付き', () => {
    const result = formatShortDate(new Date(2026, 2, 16));
    expect(result).toBe('3/16(月)');
  });
});
