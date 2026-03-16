import { DEFAULT_WEATHER_SETTINGS } from '../weather';

describe('DEFAULT_WEATHER_SETTINGS', () => {
  it('デフォルトで天気表示ON', () => {
    expect(DEFAULT_WEATHER_SETTINGS.enabled).toBe(true);
  });

  it('デフォルトで位置情報自動取得ON', () => {
    expect(DEFAULT_WEATHER_SETTINGS.autoLocation).toBe(true);
  });

  it('デフォルトで朝の通知OFF', () => {
    expect(DEFAULT_WEATHER_SETTINGS.morningNotification).toBe(false);
  });

  it('デフォルト通知時刻が07:00', () => {
    expect(DEFAULT_WEATHER_SETTINGS.morningNotificationTime).toBe('07:00');
  });

  it('デフォルト温度単位が摂氏', () => {
    expect(DEFAULT_WEATHER_SETTINGS.unit).toBe('celsius');
  });

  it('手動位置情報が未設定', () => {
    expect(DEFAULT_WEATHER_SETTINGS.manualLocation).toBeUndefined();
  });
});
