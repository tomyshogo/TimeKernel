import { useEffect, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { WeatherData, WeatherSettings, DEFAULT_WEATHER_SETTINGS } from '../types/weather';
import { fetchWeather, clearWeatherCache } from '../services/weatherService';

export function useWeather(settings: WeatherSettings = DEFAULT_WEATHER_SETTINGS) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!settings.enabled) {
      setWeather(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchWeather(settings);
      setWeather(data);
      if (!data) {
        const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
        if (!apiKey) {
          setError('天気APIキーが未設定です');
        } else {
          setError('天気データを取得できませんでした');
        }
      }
    } catch (e) {
      setError('天気データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [settings.enabled, settings.autoLocation, settings.manualLocation?.lat, settings.manualLocation?.lon]);

  // 初回取得
  useEffect(() => {
    refresh();
  }, [refresh]);

  // アプリがフォアグラウンドに戻った時に更新
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refresh();
      }
    });
    return () => subscription.remove();
  }, [refresh]);

  const forceRefresh = useCallback(async () => {
    await clearWeatherCache();
    await refresh();
  }, [refresh]);

  return { weather, isLoading, error, refresh: forceRefresh };
}
