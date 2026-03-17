import { ClothingSuggestion, WeatherData } from '../types/weather';

/**
 * 気温に基づいて服装提案を返す
 */
export function getClothingSuggestion(weather: WeatherData): ClothingSuggestion {
  const temp = weather.temp;

  let message: string;
  let icon: string;

  if (temp >= 30) {
    message = '半袖・短パンでOK。日焼け止め忘れずに';
    icon = '👕';
  } else if (temp >= 25) {
    message = '半袖で快適。薄手の羽織があると冷房対策に';
    icon = '👕';
  } else if (temp >= 20) {
    message = '長袖シャツやカーディガンがちょうどいい';
    icon = '🧥';
  } else if (temp >= 15) {
    message = 'パーカーや軽めのジャケットがおすすめ';
    icon = '🧥';
  } else if (temp >= 10) {
    message = 'しっかりめのアウター必須。マフラーもあり';
    icon = '🧣';
  } else if (temp >= 5) {
    message = 'コート + マフラー + 手袋で防寒';
    icon = '🧤';
  } else {
    message = '厚手コート + 防寒フル装備。ヒートテック推奨';
    icon = '🧤';
  }

  const rainWarning = weather.pop >= 50 ? '☔ 傘を忘れずに！' : undefined;

  return { message, icon, rainWarning };
}

/**
 * OpenWeatherMap の icon コードから表示用の天気アイコンに変換
 */
export function getWeatherEmoji(iconCode: string): string {
  const map: Record<string, string> = {
    '01d': '☀️',
    '01n': '🌙',
    '02d': '⛅',
    '02n': '☁️',
    '03d': '☁️',
    '03n': '☁️',
    '04d': '☁️',
    '04n': '☁️',
    '09d': '🌧️',
    '09n': '🌧️',
    '10d': '🌦️',
    '10n': '🌧️',
    '11d': '⛈️',
    '11n': '⛈️',
    '13d': '🌨️',
    '13n': '🌨️',
    '50d': '🌫️',
    '50n': '🌫️',
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
