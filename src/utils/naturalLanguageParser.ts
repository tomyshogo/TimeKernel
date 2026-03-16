/**
 * 自然言語入力パーサー
 * 「来週火曜14時に歯医者」→ { date, startTime, endTime, title, type }
 */
import { addDays, nextDay, format, startOfWeek, addWeeks } from 'date-fns';
import { Period, DEFAULT_PERIODS } from '../types/timetable';

export interface ParsedEvent {
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string | null; // HH:mm
  endTime: string | null;
  type: 'event' | 'shift' | 'class';
}

const DAY_MAP: Record<string, number> = {
  '日': 0, '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6,
  '日曜': 0, '月曜': 1, '火曜': 2, '水曜': 3, '木曜': 4, '金曜': 5, '土曜': 6,
  '日曜日': 0, '月曜日': 1, '火曜日': 2, '水曜日': 3, '木曜日': 4, '金曜日': 5, '土曜日': 6,
};

function resolveRelativeDate(text: string, now: Date): { date: Date; consumed: string } | null {
  // 今日
  if (/今日/.test(text)) {
    return { date: now, consumed: text.match(/今日/)![0] };
  }
  // 明日
  if (/明日/.test(text)) {
    return { date: addDays(now, 1), consumed: '明日' };
  }
  // 明後日
  if (/明後日/.test(text)) {
    return { date: addDays(now, 2), consumed: '明後日' };
  }
  // 来週X曜
  const nextWeekDay = text.match(/来週(の)?([日月火水木金土])(曜日?)?/);
  if (nextWeekDay) {
    const dayIdx = DAY_MAP[nextWeekDay[2]];
    if (dayIdx !== undefined) {
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const target = addDays(addWeeks(weekStart, 1), dayIdx === 0 ? 6 : dayIdx - 1);
      return { date: target, consumed: nextWeekDay[0] };
    }
  }
  // 再来週X曜
  const nextNextWeekDay = text.match(/再来週(の)?([日月火水木金土])(曜日?)?/);
  if (nextNextWeekDay) {
    const dayIdx = DAY_MAP[nextNextWeekDay[2]];
    if (dayIdx !== undefined) {
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const target = addDays(addWeeks(weekStart, 2), dayIdx === 0 ? 6 : dayIdx - 1);
      return { date: target, consumed: nextNextWeekDay[0] };
    }
  }
  // 今度のX曜 / 次のX曜
  const comingDay = text.match(/(今度|次)(の)?([日月火水木金土])(曜日?)?/);
  if (comingDay) {
    const dayIdx = DAY_MAP[comingDay[3]];
    if (dayIdx !== undefined) {
      return { date: nextDay(now, dayIdx as 0 | 1 | 2 | 3 | 4 | 5 | 6), consumed: comingDay[0] };
    }
  }
  // X曜 (今週の)
  const justDay = text.match(/^([日月火水木金土])(曜日?)?/);
  if (justDay) {
    const dayIdx = DAY_MAP[justDay[1]];
    if (dayIdx !== undefined) {
      return { date: nextDay(now, dayIdx as 0 | 1 | 2 | 3 | 4 | 5 | 6), consumed: justDay[0] };
    }
  }
  // M/D or M月D日
  const absDate = text.match(/(\d{1,2})[\/月](\d{1,2})(日)?/);
  if (absDate) {
    const month = parseInt(absDate[1], 10) - 1;
    const day = parseInt(absDate[2], 10);
    const target = new Date(now.getFullYear(), month, day);
    if (target < now) target.setFullYear(target.getFullYear() + 1);
    return { date: target, consumed: absDate[0] };
  }
  return null;
}

function parseTime(text: string): { startTime: string; endTime: string | null; consumed: string } | null {
  // N時間 duration
  const durationMatch = text.match(/(\d{1,2})[時:](\d{2})?分?(?:から|〜|\-|\s)\s*(\d+)時間/);
  if (durationMatch) {
    const h = parseInt(durationMatch[1], 10);
    const m = durationMatch[2] ? parseInt(durationMatch[2], 10) : 0;
    const dur = parseInt(durationMatch[3], 10);
    const start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const endH = h + dur;
    const end = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    return { startTime: start, endTime: end, consumed: durationMatch[0] };
  }
  // HH時MM分 〜 HH時MM分
  const rangeMatch = text.match(/(\d{1,2})時(\d{2})?分?[から〜\-](\d{1,2})時(\d{2})?分?/);
  if (rangeMatch) {
    const start = `${String(parseInt(rangeMatch[1])).padStart(2, '0')}:${rangeMatch[2] || '00'}`;
    const end = `${String(parseInt(rangeMatch[3])).padStart(2, '0')}:${rangeMatch[4] || '00'}`;
    return { startTime: start, endTime: end, consumed: rangeMatch[0] };
  }
  // N時(MM分)
  const simpleTime = text.match(/(\d{1,2})時(\d{2})?分?/);
  if (simpleTime) {
    const h = parseInt(simpleTime[1], 10);
    const m = simpleTime[2] ? parseInt(simpleTime[2], 10) : 0;
    return {
      startTime: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      endTime: null,
      consumed: simpleTime[0],
    };
  }
  // HH:MM
  const colonTime = text.match(/(\d{1,2}):(\d{2})/);
  if (colonTime) {
    const h = parseInt(colonTime[1], 10);
    const m = parseInt(colonTime[2], 10);
    return {
      startTime: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      endTime: null,
      consumed: colonTime[0],
    };
  }
  return null;
}

function parsePeriod(
  text: string,
  periods: Period[] = DEFAULT_PERIODS
): { startTime: string; endTime: string; consumed: string } | null {
  const periodMatch = text.match(/(\d)[限コマ]/);
  if (periodMatch) {
    const num = parseInt(periodMatch[1], 10);
    const p = periods.find((pr) => pr.period === num);
    if (p) {
      return { startTime: p.startTime, endTime: p.endTime, consumed: periodMatch[0] };
    }
  }
  return null;
}

function detectType(text: string): 'event' | 'shift' | 'class' {
  if (/バイト|シフト|勤務/.test(text)) return 'shift';
  if (/[限コマ]|授業|講義|ゼミ|演習|実験/.test(text)) return 'class';
  return 'event';
}

/**
 * 自然言語テキストをパースしてイベント情報を抽出する
 */
export function parseNaturalLanguage(
  input: string,
  now: Date = new Date(),
  periods: Period[] = DEFAULT_PERIODS
): ParsedEvent | null {
  const text = input.trim();
  if (!text) return null;

  // 1. 日付の解析
  const dateResult = resolveRelativeDate(text, now);
  const dateStr = dateResult
    ? format(dateResult.date, 'yyyy-MM-dd')
    : format(now, 'yyyy-MM-dd');

  // 2. 時限の解析
  const periodResult = parsePeriod(text, periods);

  // 3. 時刻の解析
  const timeResult = periodResult ? null : parseTime(text);

  const startTime = periodResult?.startTime || timeResult?.startTime || null;
  const endTime = periodResult?.endTime || timeResult?.endTime || null;

  // 4. タイプ判定
  const type = detectType(text);

  // 5. タイトル抽出（日時系トークンを除去）
  let title = text;
  const tokensToRemove = [
    dateResult?.consumed,
    periodResult?.consumed,
    timeResult?.consumed,
  ].filter(Boolean) as string[];

  // 助詞や接続詞も除去
  for (const token of tokensToRemove) {
    title = title.replace(token, '');
  }
  title = title
    .replace(/^[のにでからへと、,\s]+/, '')
    .replace(/[のにでからへと、,\s]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!title) return null;

  return {
    title,
    date: dateStr,
    startTime,
    endTime,
    type,
  };
}
