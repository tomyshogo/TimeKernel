import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeatherData, WeatherSettings } from '../types/weather';
import { getLocation } from './locationService';

const CACHE_KEY = 'weather_cache';
const CACHE_TTL = 3 * 60 * 60 * 1000; // 3時間

/**
 * OpenWeatherMap APIキーを取得
 * 環境変数または Firebase Remote Config から取得
 */
function getApiKey(): string {
  return process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '';
}

/**
 * 天気データを取得（キャッシュ優先）
 */
export async function fetchWeather(
  settings: WeatherSettings
): Promise<WeatherData | null> {
  if (!settings.enabled) return null;

  // キャッシュ確認
  const cached = await getCachedWeather();
  if (cached) return cached;

  // 位置情報取得
  let lat: number;
  let lon: number;

  if (settings.autoLocation) {
    const location = await getLocation();
    if (!location) return null;
    lat = location.lat;
    lon = location.lon;
  } else if (settings.manualLocation) {
    lat = settings.manualLocation.lat;
    lon = settings.manualLocation.lon;
  } else {
    return null;
  }

  // API呼び出し
  const data = await fetchWeatherFromApi(lat, lon);
  if (data) {
    await cacheWeather(data);
  }
  return data;
}

/**
 * OpenWeatherMap Current Weather API を呼び出す
 */
async function fetchWeatherFromApi(
  lat: number,
  lon: number
): Promise<WeatherData | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[Weather] API key not configured');
    return null;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[Weather] API error: ${response.status}`);
      return null;
    }

    const json = await response.json();

    // 降水確率は forecast API が必要なので、rain データから推定
    const hasRain = json.rain || json.snow;
    const pop = hasRain ? 80 : json.clouds?.all > 70 ? 40 : 10;

    return {
      temp: json.main.temp,
      tempMax: json.main.temp_max,
      tempMin: json.main.temp_min,
      pop,
      icon: json.weather[0]?.icon || '01d',
      description: json.weather[0]?.description || '',
      fetchedAt: new Date().toISOString(),
      cityName: json.name || '',
    };
  } catch (error) {
    console.warn('[Weather] Fetch failed:', error);
    return null;
  }
}

/**
 * キャッシュから天気データを取得（TTL内のみ）
 */
async function getCachedWeather(): Promise<WeatherData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const data: WeatherData = JSON.parse(raw);
    const elapsed = Date.now() - new Date(data.fetchedAt).getTime();

    if (elapsed > CACHE_TTL) {
      await AsyncStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * 天気データをキャッシュに保存
 */
async function cacheWeather(data: WeatherData): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // キャッシュ書き込み失敗は無視
  }
}

/**
 * キャッシュをクリア（設定変更時などに使用）
 */
export async function clearWeatherCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}
