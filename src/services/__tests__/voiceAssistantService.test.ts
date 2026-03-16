import {
  parseVoiceCommand,
  formatEventsForVoice,
  formatNextEventForVoice,
  formatShiftSummaryForVoice,
  formatTasksForVoice,
} from '../voiceAssistantService';

describe('parseVoiceCommand', () => {
  it('「今日の予定」→ getTodayEvents', () => {
    const result = parseVoiceCommand('今日の予定を教えて');
    expect(result).toEqual({ type: 'getTodayEvents' });
  });

  it('「次の予定」→ getNextEvent', () => {
    const result = parseVoiceCommand('次の予定は？');
    expect(result).toEqual({ type: 'getNextEvent' });
  });

  it('「バイト代」→ getShiftSummary', () => {
    const result = parseVoiceCommand('今月のバイト代は？');
    expect(result).toEqual({ type: 'getShiftSummary' });
  });

  it('「課題」→ getUpcomingTasks', () => {
    const result = parseVoiceCommand('今週の課題の締切は？');
    expect(result).toEqual({ type: 'getUpcomingTasks' });
  });

  it('「追加して」→ addEvent', () => {
    const result = parseVoiceCommand('明日14時に歯医者を追加して');
    expect(result).toEqual({ type: 'addEvent', text: '明日14時に歯医者を追加して' });
  });

  it('「空き時間」→ getFreeSlots', () => {
    const result = parseVoiceCommand('明日の空き時間は？');
    expect(result).toEqual({ type: 'getFreeSlots', date: '明日' });
  });
});

describe('formatEventsForVoice', () => {
  it('予定なしの場合', () => {
    const result = formatEventsForVoice([]);
    expect(result.text).toBe('今日の予定はありません。');
    expect(result.ssml).toContain('<speak>');
  });

  it('予定ありの場合', () => {
    const result = formatEventsForVoice([
      { title: 'ゼミ', startTime: '10:00', endTime: '12:00' },
      { title: '歯医者', startTime: '14:00', endTime: '15:00' },
    ]);
    expect(result.text).toContain('2件の予定');
    expect(result.text).toContain('ゼミ');
    expect(result.text).toContain('歯医者');
  });
});

describe('formatNextEventForVoice', () => {
  it('次の予定なし', () => {
    const result = formatNextEventForVoice(null);
    expect(result.text).toBe('次の予定はありません。');
  });

  it('次の予定あり', () => {
    const result = formatNextEventForVoice({
      title: '会議',
      startTime: '14:00',
      minutesUntil: 90,
    });
    expect(result.text).toContain('会議');
    expect(result.text).toContain('1時間30分後');
  });
});

describe('formatShiftSummaryForVoice', () => {
  it('バイト集計', () => {
    const result = formatShiftSummaryForVoice(40, 48000);
    expect(result.text).toContain('40時間');
    expect(result.text).toContain('48,000円');
  });
});

describe('formatTasksForVoice', () => {
  it('課題なし', () => {
    const result = formatTasksForVoice([]);
    expect(result.text).toBe('直近の課題はありません。');
  });

  it('課題あり', () => {
    const result = formatTasksForVoice([
      { title: 'レポート', subject: '経済学', daysUntil: 3 },
      { title: '中間テスト', subject: '数学', daysUntil: 0 },
    ]);
    expect(result.text).toContain('2件の課題');
    expect(result.text).toContain('あと3日');
    expect(result.text).toContain('今日が締切');
  });
});
