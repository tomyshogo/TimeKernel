import * as Notifications from 'expo-notifications';
import { WeatherSettings } from '../types/weather';
import { fetchWeather } from './weatherService';
import { getClothingSuggestion, getWeatherEmoji, formatTemp } from '../utils/weatherClothing';

const WEATHER_NOTIFICATION_ID = 'weather_morning';

/**
 * 朝の天気通知をスケジュールする
 */
export async function scheduleWeatherNotification(
  settings: WeatherSettings
): Promise<void> {
  // 既存の天気通知をキャンセル
  await cancelWeatherNotification();

  if (!settings.morningNotification || !settings.enabled) return;

  const [hours, minutes] = settings.morningNotificationTime.split(':').map(Number);

  await Notifications.scheduleNotificationAsync({
    identifier: WEATHER_NOTIFICATION_ID,
    content: {
      title: '☀️ 今日の天気',
      body: '天気情報を確認してね',
      data: { type: 'weather_morning' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
      channelId: 'reminders',
    },
  });
}

/**
 * 天気通知をキャンセル
 */
export async function cancelWeatherNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(WEATHER_NOTIFICATION_ID).catch(() => {});
}

/**
 * 天気データ付きの即時通知を送信（バックグラウンド更新用）
 */
export async function sendWeatherNotificationNow(
  settings: WeatherSettings
): Promise<void> {
  const weather = await fetchWeather(settings);
  if (!weather) return;

  const suggestion = getClothingSuggestion(weather);
  const emoji = getWeatherEmoji(weather.icon);
  const temp = formatTemp(weather.temp, settings.unit);

  let body = `${emoji} ${temp} ${weather.description}\n${suggestion.icon} ${suggestion.message}`;
  if (suggestion.rainWarning) {
    body += `\n${suggestion.rainWarning}`;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `☀️ 今日の天気 - ${weather.cityName}`,
      body,
      data: { type: 'weather_info' },
    },
    trigger: null, // 即時送信
  });
}
