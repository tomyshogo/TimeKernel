export interface WeatherData {
  /** 現在の気温 (℃) */
  temp: number;
  /** 最高気温 (℃) */
  tempMax: number;
  /** 最低気温 (℃) */
  tempMin: number;
  /** 降水確率 (0-100) */
  pop: number;
  /** 天気コード (OpenWeatherMap icon code) */
  icon: string;
  /** 天気の説明 ("晴れ", "曇り" etc.) */
  description: string;
  /** 取得時刻 (ISO string) */
  fetchedAt: string;
  /** 都市名 */
  cityName: string;
}

export interface WeatherSettings {
  /** 天気表示ON/OFF */
  enabled: boolean;
  /** 位置情報の自動取得 */
  autoLocation: boolean;
  /** 手動設定の都市 (緯度経度) */
  manualLocation?: {
    lat: number;
    lon: number;
    name: string;
  };
  /** 朝の天気通知ON/OFF */
  morningNotification: boolean;
  /** 朝の通知時刻 (HH:MM) */
  morningNotificationTime: string;
  /** 温度単位 */
  unit: 'celsius' | 'fahrenheit';
}

export const DEFAULT_WEATHER_SETTINGS: WeatherSettings = {
  enabled: true,
  autoLocation: true,
  morningNotification: false,
  morningNotificationTime: '07:00',
  unit: 'celsius',
};

export interface ClothingSuggestion {
  message: string;
  icon: string;
  rainWarning?: string;
}
