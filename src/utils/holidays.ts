/**
 * 日本の祝日判定
 * 固定祝日 + ハッピーマンデー + 振替休日に対応
 */

interface FixedHoliday {
  month: number;
  day: number;
  name: string;
}

interface HappyMondayHoliday {
  month: number;
  week: number; // 第N月曜
  name: string;
}

const FIXED_HOLIDAYS: FixedHoliday[] = [
  { month: 1, day: 1, name: '元日' },
  { month: 2, day: 11, name: '建国記念の日' },
  { month: 2, day: 23, name: '天皇誕生日' },
  { month: 4, day: 29, name: '昭和の日' },
  { month: 5, day: 3, name: '憲法記念日' },
  { month: 5, day: 4, name: 'みどりの日' },
  { month: 5, day: 5, name: 'こどもの日' },
  { month: 8, day: 11, name: '山の日' },
  { month: 11, day: 3, name: '文化の日' },
  { month: 11, day: 23, name: '勤労感謝の日' },
];

const HAPPY_MONDAY_HOLIDAYS: HappyMondayHoliday[] = [
  { month: 1, week: 2, name: '成人の日' },
  { month: 7, week: 3, name: '海の日' },
  { month: 9, week: 3, name: '敬老の日' },
  { month: 10, week: 2, name: 'スポーツの日' },
];

function getNthMonday(year: number, month: number, n: number): Date {
  const first = new Date(year, month - 1, 1);
  const firstDow = first.getDay();
  const firstMonday = firstDow <= 1 ? 1 + (1 - firstDow) : 1 + (8 - firstDow);
  return new Date(year, month - 1, firstMonday + (n - 1) * 7);
}

function getVernalEquinox(year: number): number {
  // 春分の日の近似計算
  return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

function getAutumnalEquinox(year: number): number {
  // 秋分の日の近似計算
  return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

/** 指定年の全祝日をMapで返す (key: "YYYY-MM-DD") */
export function getHolidaysForYear(year: number): Map<string, string> {
  const holidays = new Map<string, string>();

  const addHoliday = (d: Date, name: string) => {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    holidays.set(key, name);
  };

  // 固定祝日
  for (const h of FIXED_HOLIDAYS) {
    addHoliday(new Date(year, h.month - 1, h.day), h.name);
  }

  // ハッピーマンデー
  for (const h of HAPPY_MONDAY_HOLIDAYS) {
    addHoliday(getNthMonday(year, h.month, h.week), h.name);
  }

  // 春分の日・秋分の日
  addHoliday(new Date(year, 2, getVernalEquinox(year)), '春分の日');
  addHoliday(new Date(year, 8, getAutumnalEquinox(year)), '秋分の日');

  // 振替休日（祝日が日曜の場合、翌月曜が振替休日）
  const allDates = Array.from(holidays.keys()).sort();
  for (const dateStr of allDates) {
    const d = new Date(dateStr);
    if (d.getDay() === 0) {
      // 翌日以降で祝日でない最初の平日を振替休日にする
      const sub = new Date(d);
      sub.setDate(sub.getDate() + 1);
      while (holidays.has(`${sub.getFullYear()}-${String(sub.getMonth() + 1).padStart(2, '0')}-${String(sub.getDate()).padStart(2, '0')}`)) {
        sub.setDate(sub.getDate() + 1);
      }
      addHoliday(sub, '振替休日');
    }
  }

  // 国民の休日（祝日に挟まれた平日）
  const sortedDates = Array.from(holidays.keys()).sort();
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const d1 = new Date(sortedDates[i]);
    const d2 = new Date(sortedDates[i + 1]);
    const diff = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 2) {
      const between = new Date(d1);
      between.setDate(between.getDate() + 1);
      const betweenKey = `${between.getFullYear()}-${String(between.getMonth() + 1).padStart(2, '0')}-${String(between.getDate()).padStart(2, '0')}`;
      if (!holidays.has(betweenKey) && between.getDay() !== 0) {
        holidays.set(betweenKey, '国民の休日');
      }
    }
  }

  return holidays;
}

/** 指定日が祝日かどうか */
export function isHoliday(date: Date): boolean {
  const holidays = getHolidaysForYear(date.getFullYear());
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return holidays.has(key);
}
