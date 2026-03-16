/**
 * 音声アシスタント連携サービス
 * Alexa / Siri / Google Assistant からのコマンドを処理する共通レイヤー
 */
import { parseNaturalLanguage } from '../utils/naturalLanguageParser';

export type VoiceCommand =
  | { type: 'getTodayEvents' }
  | { type: 'getNextEvent' }
  | { type: 'addEvent'; text: string }
  | { type: 'getFreeSlots'; date: string }
  | { type: 'getShiftSummary' }
  | { type: 'getUpcomingTasks' };

export interface VoiceResponse {
  text: string;
  ssml?: string;
}

/**
 * 音声コマンドを解析して VoiceCommand に変換する
 */
export function parseVoiceCommand(utterance: string): VoiceCommand | null {
  const text = utterance.trim();

  // 予定確認
  if (/今日の予定/.test(text)) {
    return { type: 'getTodayEvents' };
  }
  if (/次の予定/.test(text)) {
    return { type: 'getNextEvent' };
  }

  // 空き時間
  if (/空き時間/.test(text)) {
    const dateMatch = text.match(/(今日|明日|明後日)/);
    const date = dateMatch ? dateMatch[1] : '今日';
    return { type: 'getFreeSlots', date };
  }

  // バイト代
  if (/バイト代|給料/.test(text)) {
    return { type: 'getShiftSummary' };
  }

  // 課題
  if (/課題|宿題|レポート|テスト/.test(text)) {
    return { type: 'getUpcomingTasks' };
  }

  // 予定追加
  if (/追加|登録|入れて/.test(text)) {
    return { type: 'addEvent', text };
  }

  return null;
}

/**
 * SSML形式の音声応答を生成
 */
export function buildSSML(text: string): string {
  return `<speak>${text}</speak>`;
}

/**
 * 今日の予定一覧を読み上げ形式に変換
 */
export function formatEventsForVoice(
  events: { title: string; startTime: string; endTime: string }[]
): VoiceResponse {
  if (events.length === 0) {
    return {
      text: '今日の予定はありません。',
      ssml: buildSSML('今日の予定はありません。'),
    };
  }

  const lines = events.map(
    (e) => `${e.startTime}から${e.endTime}まで、${e.title}`
  );
  const text = `今日は${events.length}件の予定があります。${lines.join('。')}。`;
  return {
    text,
    ssml: buildSSML(
      `今日は${events.length}件の予定があります。<break time="300ms"/>` +
        lines.join('<break time="200ms"/>') +
        '。'
    ),
  };
}

/**
 * 次の予定を読み上げ形式に変換
 */
export function formatNextEventForVoice(
  event: { title: string; startTime: string; minutesUntil: number } | null
): VoiceResponse {
  if (!event) {
    return {
      text: '次の予定はありません。',
      ssml: buildSSML('次の予定はありません。'),
    };
  }

  const timeText =
    event.minutesUntil > 60
      ? `${Math.floor(event.minutesUntil / 60)}時間${event.minutesUntil % 60}分後`
      : `${event.minutesUntil}分後`;

  const text = `次の予定は${event.title}です。${event.startTime}から、${timeText}に始まります。`;
  return { text, ssml: buildSSML(text) };
}

/**
 * バイト代を読み上げ形式に変換
 */
export function formatShiftSummaryForVoice(
  totalHours: number,
  totalWage: number
): VoiceResponse {
  const text = `今月のバイトは合計${totalHours}時間で、見込み給料は${totalWage.toLocaleString()}円です。`;
  return { text, ssml: buildSSML(text) };
}

/**
 * 課題一覧を読み上げ形式に変換
 */
export function formatTasksForVoice(
  tasks: { title: string; subject: string; daysUntil: number }[]
): VoiceResponse {
  if (tasks.length === 0) {
    return {
      text: '直近の課題はありません。',
      ssml: buildSSML('直近の課題はありません。'),
    };
  }

  const lines = tasks.map((t) => {
    if (t.daysUntil === 0) return `${t.subject}の${t.title}は今日が締切です`;
    if (t.daysUntil === 1) return `${t.subject}の${t.title}は明日が締切です`;
    return `${t.subject}の${t.title}はあと${t.daysUntil}日です`;
  });

  const text = `${tasks.length}件の課題があります。${lines.join('。')}。`;
  return { text, ssml: buildSSML(text) };
}
