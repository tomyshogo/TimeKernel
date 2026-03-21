import {
  getDaysUntilExam,
  getDaysLabel,
} from '../examHelpers';

describe('getDaysUntilExam', () => {
  const makeDateStr = (daysFromNow: number): string => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  };

  it('明日の試験 → 1日', () => {
    const result = getDaysUntilExam(makeDateStr(1));
    expect(result).toBe(1);
  });

  it('今日の試験 → 0日', () => {
    const result = getDaysUntilExam(makeDateStr(0));
    expect(result).toBe(0);
  });

  it('昨日の試験 → -1日', () => {
    const result = getDaysUntilExam(makeDateStr(-1));
    expect(result).toBe(-1);
  });

  it('30日後 → 30日', () => {
    const result = getDaysUntilExam(makeDateStr(30));
    expect(result).toBe(30);
  });
});

describe('getDaysLabel', () => {
  it('マイナス日数 → 「終了」', () => {
    expect(getDaysLabel(-1)).toBe('終了');
    expect(getDaysLabel(-30)).toBe('終了');
  });

  it('0日 → 「今日」', () => {
    expect(getDaysLabel(0)).toBe('今日');
  });

  it('1日 → 「明日」', () => {
    expect(getDaysLabel(1)).toBe('明日');
  });

  it('2日以上 → 「あとN日」', () => {
    expect(getDaysLabel(2)).toBe('あと2日');
    expect(getDaysLabel(30)).toBe('あと30日');
    expect(getDaysLabel(365)).toBe('あと365日');
  });
});
