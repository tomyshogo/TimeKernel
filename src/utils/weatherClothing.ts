import { ClothingSuggestion, WeatherData, ForecastEntry } from '../types/weather';
import { CalendarEvent } from '../types/event';

interface ClothingRule {
  minTemp: number;
  message: string;
  icon: string;
}

const CLOTHING_RULES: ClothingRule[] = [
  { minTemp: 30, message: '半袖・短パンでOK。日焼け止め忘れずに', icon: '👕' },
  { minTemp: 25, message: '半袖で快適。薄手の羽織があると冷房対策に', icon: '👕' },
  { minTemp: 20, message: '長袖シャツやカーディガンがちょうどいい', icon: '🧥' },
  { minTemp: 15, message: 'パーカーや軽めのジャケットがおすすめ', icon: '🧥' },
  { minTemp: 10, message: 'しっかりめのアウター必須。マフラーもあり', icon: '🧣' },
  { minTemp: 5, message: 'コート + マフラー + 手袋で防寒', icon: '🧤' },
  { minTemp: -Infinity, message: '厚手コート + 防寒フル装備。ヒートテック推奨', icon: '🧤' },
];

function getSuggestionForTemp(temp: number): { message: string; icon: string } {
  for (const rule of CLOTHING_RULES) {
    if (temp >= rule.minTemp) return { message: rule.message, icon: rule.icon };
  }
  return CLOTHING_RULES[CLOTHING_RULES.length - 1];
}

/**
 * 気温に基づいて服装提案を返す（基本版）
 */
export function getClothingSuggestion(weather: WeatherData): ClothingSuggestion {
  const { message, icon } = getSuggestionForTemp(weather.temp);
  const rainWarning = weather.pop >= 50 ? '☔ 傘を忘れずに！' : undefined;
  return { message, icon, rainWarning };
}

/**
 * 今日の予定を考慮した服装提案を返す
 * - 次の予定の時間帯の予報気温で提案
 * - 外出中の最低気温・最高気温を考慮
 * - 降水確率が高い時間帯があれば傘の提案
 */
export function getSmartClothingSuggestion(
  weather: WeatherData,
  todayEvents: CalendarEvent[]
): ClothingSuggestion {
  const forecast = weather.forecast || [];
  const now = new Date();
  const nowHour = now.getHours();
  const nowTime = `${String(nowHour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // 今日のこれからの予定を取得（時間割・試験除外）
  const upcomingEvents = todayEvents
    .filter((e) => !e.id.startsWith('timetable_') && !e.id.startsWith('exam_'))
    .filter((e) => e.startTime > nowTime)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // 予報がない場合は現在の気温で提案
  if (forecast.length === 0) {
    if (upcomingEvents.length > 0) {
      const next = upcomingEvents[0];
      const { message, icon } = getSuggestionForTemp(weather.temp);
      const rainWarning = weather.pop >= 50 ? '☔ 傘を忘れずに！' : undefined;
      return { message, icon, rainWarning, context: `${next.startTime}〜 ${next.title}` };
    }
    return getClothingSuggestion(weather);
  }

  // これからの予報を取得
  const upcomingForecast = forecast.filter((f) => {
    const fHour = parseInt(f.dt.split(' ')[1]?.split(':')[0] || '0', 10);
    return fHour >= nowHour;
  });

  if (upcomingEvents.length === 0) {
    // 予定なし → 今日の残り時間の気温範囲で提案
    if (upcomingForecast.length > 0) {
      const minTemp = Math.min(...upcomingForecast.map((f) => f.temp));
      const maxPop = Math.max(...upcomingForecast.map((f) => f.pop));
      const { message, icon } = getSuggestionForTemp(minTemp);
      const rainWarning = maxPop >= 50 ? '☔ 傘を忘れずに！' : undefined;
      return { message, icon, rainWarning };
    }
    return getClothingSuggestion(weather);
  }

  // 次の予定の時間帯に最も近い予報を探す
  const nextEvent = upcomingEvents[0];
  const eventHour = parseInt(nextEvent.startTime.split(':')[0], 10);

  let closestForecast: ForecastEntry | null = null;
  let minDiff = Infinity;
  for (const f of forecast) {
    const fHour = parseInt(f.dt.split(' ')[1]?.split(':')[0] || '0', 10);
    const diff = Math.abs(fHour - eventHour);
    if (diff < minDiff) {
      minDiff = diff;
      closestForecast = f;
    }
  }

  // 予定の時間帯前後の予報から最低気温・降水確率を取得
  const relevantForecast = forecast.filter((f) => {
    const fHour = parseInt(f.dt.split(' ')[1]?.split(':')[0] || '0', 10);
    return fHour >= nowHour && fHour <= eventHour + 3;
  });

  const targetTemp = closestForecast ? closestForecast.temp : weather.temp;
  const maxPop = relevantForecast.length > 0
    ? Math.max(...relevantForecast.map((f) => f.pop))
    : weather.pop;

  const { message, icon } = getSuggestionForTemp(targetTemp);
  const rainWarning = maxPop >= 50
    ? `☔ ${eventHour}時頃 降水確率${maxPop}% 傘を忘れずに！`
    : undefined;

  return {
    message,
    icon,
    rainWarning,
    context: `${nextEvent.startTime}〜 ${nextEvent.title} の時間帯`,
  };
}

/**
 * OpenWeatherMap の icon コードから表示用の天気アイコンに変換
 */
export function getWeatherEmoji(iconCode: string): string {
  const map: Record<string, string> = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '🌨️', '13n': '🌨️',
    '50d': '🌫️', '50n': '🌫️',
  };
  return map[iconCode] || '🌤️';
}

/**
 * 気温の表示（華氏変換対応）
 */
export function formatTemp(celsius: number, unit: 'celsius' | 'fahrenheit'): string {
  if (unit === 'fahrenheit') {
    return `${Math.round(celsius * 9 / 5 + 32)}°F`;
  }
  return `${Math.round(celsius)}℃`;
}
