import { addDays, formatDate } from '../utils/dateHelpers';
import { EventType, RecurrenceRule } from '../types';

export type ParsedAction = 'add' | 'delete';

export interface ParsedEvent {
  title: string;
  date: string;
  /** 複数日に個別イベントを作成する場合の日付リスト */
  dates?: string[];
  startTime?: string;
  endTime?: string;
  type?: EventType;
  recurrence?: RecurrenceRule;
  action: ParsedAction;
}

const WEEKDAY_MAP: Record<string, number> = {
  '日': 0, '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6,
};

const SHIFT_KEYWORDS = ['バイト', 'シフト', '勤務', 'ワーク', 'work'];
const CLASS_KEYWORDS = ['授業', '講義', 'ゼミ', '演習'];

function detectType(text: string): EventType {
  const lower = text.toLowerCase();
  if (SHIFT_KEYWORDS.some((k) => lower.includes(k))) return 'shift';
  if (CLASS_KEYWORDS.some((k) => lower.includes(k))) return 'class';
  return 'event';
}

/**
 * 指定月の特定曜日の全日付を返す
 */
function getAllWeekdaysInMonth(year: number, month: number, dayOfWeek: number): Date[] {
  const dates: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    if (d.getDay() === dayOfWeek) {
      dates.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export function parseNaturalLanguage(input: string): ParsedEvent | null {
  const text = input.trim();
  if (!text) return null;

  const now = new Date();
  let date: Date | null = null;
  let dates: Date[] | null = null;
  let recurrence: RecurrenceRule | undefined;
  let startTime: string | undefined;
  let endTime: string | undefined;
  let remaining = text;

  // --- アクション検出 ---
  const DELETE_KEYWORDS = ['削除', '消して', '取り消し', 'キャンセル', '消す', '外して', '除く'];
  let action: ParsedAction = 'add';
  for (const kw of DELETE_KEYWORDS) {
    if (remaining.includes(kw)) {
      action = 'delete';
      remaining = remaining.replace(kw, '');
      break;
    }
  }

  // --- 繰り返し + 曜日パターン ---

  // 「毎週X曜日」「毎週X曜」
  const weeklyMatch = remaining.match(/毎週([日月火水木金土])曜日?/);
  if (weeklyMatch) {
    const dow = WEEKDAY_MAP[weeklyMatch[1]];
    if (dow !== undefined) {
      if (action === 'delete') {
        // 削除時: 今月の全該当曜日を対象
        dates = getAllWeekdaysInMonth(now.getFullYear(), now.getMonth(), dow);
        if (dates.length > 0) date = dates[0];
      } else {
        const currentDow = now.getDay();
        let diff = dow - currentDow;
        if (diff <= 0) diff += 7;
        date = addDays(now, diff);
        recurrence = { frequency: 'weekly', daysOfWeek: [dow] };
      }
      remaining = remaining.replace(weeklyMatch[0], '');
    }
  }

  // 「今月の毎週X曜日」「今月のX曜日」「今月X曜」
  if (!date && !dates) {
    const monthlyDowMatch = remaining.match(/今月の?(?:毎週)?([日月火水木金土])曜日?/);
    if (monthlyDowMatch) {
      const dow = WEEKDAY_MAP[monthlyDowMatch[1]];
      if (dow !== undefined) {
        dates = getAllWeekdaysInMonth(now.getFullYear(), now.getMonth(), dow);
        if (dates.length > 0) date = dates[0];
        remaining = remaining.replace(monthlyDowMatch[0], '');
      }
    }
  }

  // 「来月の毎週X曜日」「来月のX曜日」
  if (!date && !dates) {
    const nextMonthDowMatch = remaining.match(/来月の?(?:毎週)?([日月火水木金土])曜日?/);
    if (nextMonthDowMatch) {
      const dow = WEEKDAY_MAP[nextMonthDowMatch[1]];
      if (dow !== undefined) {
        const nextMonth = now.getMonth() + 1;
        const nextYear = nextMonth > 11 ? now.getFullYear() + 1 : now.getFullYear();
        dates = getAllWeekdaysInMonth(nextYear, nextMonth % 12, dow);
        if (dates.length > 0) date = dates[0];
        remaining = remaining.replace(nextMonthDowMatch[0], '');
      }
    }
  }

  // --- 単発日付パース ---

  // 「X月Y日」
  if (!date) {
    const mdMatch = remaining.match(/(\d{1,2})月(\d{1,2})日/);
    if (mdMatch) {
      const m = parseInt(mdMatch[1], 10);
      const d = parseInt(mdMatch[2], 10);
      let y = now.getFullYear();
      const candidate = new Date(y, m - 1, d);
      if (candidate < now) {
        candidate.setFullYear(y + 1);
      }
      date = candidate;
      remaining = remaining.replace(mdMatch[0], '');
    }
  }

  // 「今日」「明日」「明後日」
  if (!date) {
    if (remaining.includes('今日')) {
      date = now;
      remaining = remaining.replace('今日', '');
    } else if (remaining.includes('明後日')) {
      date = addDays(now, 2);
      remaining = remaining.replace('明後日', '');
    } else if (remaining.includes('明日')) {
      date = addDays(now, 1);
      remaining = remaining.replace('明日', '');
    }
  }

  // 「X日後」
  if (!date) {
    const daysLater = remaining.match(/(\d+)日後/);
    if (daysLater) {
      date = addDays(now, parseInt(daysLater[1], 10));
      remaining = remaining.replace(daysLater[0], '');
    }
  }

  // 「X週間後」
  if (!date) {
    const weeksLater = remaining.match(/(\d+)週間後/);
    if (weeksLater) {
      date = addDays(now, parseInt(weeksLater[1], 10) * 7);
      remaining = remaining.replace(weeksLater[0], '');
    }
  }
  if (!date) {
    const kanjiWeek = remaining.match(/(一|二|三|四)週間後/);
    if (kanjiWeek) {
      const kanjiMap: Record<string, number> = { '一': 1, '二': 2, '三': 3, '四': 4 };
      date = addDays(now, (kanjiMap[kanjiWeek[1]] ?? 1) * 7);
      remaining = remaining.replace(kanjiWeek[0], '');
    }
  }

  // 「来週」「再来週」
  if (!date) {
    if (remaining.includes('再来週')) {
      date = addDays(now, 14);
      remaining = remaining.replace('再来週', '');
    } else if (remaining.includes('来週')) {
      date = addDays(now, 7);
      remaining = remaining.replace('来週', '');
    }
  }

  // 「来月」（曜日なし）
  if (!date) {
    if (remaining.includes('来月')) {
      date = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      remaining = remaining.replace('来月', '');
    }
  }

  // 「次のX曜日」「今度のX曜日」「X曜日」
  if (!date) {
    const dowMatch = remaining.match(/(次の|今度の)?([日月火水木金土])曜日?/);
    if (dowMatch) {
      const targetDow = WEEKDAY_MAP[dowMatch[2]];
      if (targetDow !== undefined) {
        const currentDow = now.getDay();
        let diff = targetDow - currentDow;
        if (diff <= 0) diff += 7;
        date = addDays(now, diff);
        remaining = remaining.replace(dowMatch[0], '');
      }
    }
  }

  // デフォルト: 今日
  if (!date) {
    date = now;
  }

  // --- 時間パース ---

  function parseTimeExpr(s: string): { hours: number; minutes: number } | null {
    const ampm = s.match(/(午前|午後)(\d{1,2})時(?:半|(\d{1,2})分)?/);
    if (ampm) {
      let h = parseInt(ampm[2], 10);
      if (ampm[1] === '午後' && h < 12) h += 12;
      if (ampm[1] === '午前' && h === 12) h = 0;
      const m = ampm[0].includes('半') ? 30 : ampm[3] ? parseInt(ampm[3], 10) : 0;
      return { hours: h, minutes: m };
    }
    const jp = s.match(/(\d{1,2})時(?:半|(\d{1,2})分)?/);
    if (jp) {
      const h = parseInt(jp[1], 10);
      const m = jp[0].includes('半') ? 30 : jp[2] ? parseInt(jp[2], 10) : 0;
      return { hours: h, minutes: m };
    }
    const colon = s.match(/(\d{1,2}):(\d{2})/);
    if (colon) {
      return { hours: parseInt(colon[1], 10), minutes: parseInt(colon[2], 10) };
    }
    return null;
  }

  function formatTime(h: number, m: number): string {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const TIME_PATTERN = '(?:(?:午前|午後)?\\d{1,2}時(?:半|\\d{1,2}分)?|\\d{1,2}:\\d{2})';
  const RANGE_SEP = '(?:から|〜|~|ー|－|−|-)';

  const rangeRegex = new RegExp(`(${TIME_PATTERN})\\s*${RANGE_SEP}\\s*(${TIME_PATTERN})`);
  const rangeMatch = remaining.match(rangeRegex);

  if (rangeMatch) {
    const s = parseTimeExpr(rangeMatch[1]);
    const e = parseTimeExpr(rangeMatch[2]);
    if (s) startTime = formatTime(s.hours, s.minutes);
    if (e) endTime = formatTime(e.hours, e.minutes);
    remaining = remaining.replace(rangeMatch[0], '');
  } else {
    const singleRegex = new RegExp(TIME_PATTERN);
    const singleMatch = remaining.match(singleRegex);
    if (singleMatch) {
      const t = parseTimeExpr(singleMatch[0]);
      if (t) startTime = formatTime(t.hours, t.minutes);
      remaining = remaining.replace(singleMatch[0], '');
    }
  }

  if (startTime && !endTime) {
    const [sh, sm] = startTime.split(':').map(Number);
    endTime = formatTime(sh + 1, sm);
  }

  // --- タイプ検出 ---
  const type = detectType(remaining);

  // --- タイトル抽出 ---
  let title = remaining
    .replace(/[にのをはがでへとから、。！？!?]/g, ' ')
    .replace(/予定|入れて|追加|して|ください|お願い|登録|する|よろしく|です|ます|けど|けれど|だけど|毎週|今月|来月/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!title) {
    // タイプに応じたデフォルトタイトル
    if (type === 'shift') title = 'バイト';
    else if (type === 'class') title = '授業';
    else return null;
  }

  return {
    title,
    date: formatDate(date),
    dates: dates ? dates.map(formatDate) : undefined,
    startTime,
    endTime,
    type,
    recurrence,
    action,
  };
}
