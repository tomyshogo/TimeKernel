import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Switch, Alert, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/stores/authStore';
import { updateUserSettings } from '../../src/services/userService';
import { clearWeatherCache } from '../../src/services/weatherService';
import { scheduleWeatherNotification } from '../../src/services/weatherNotificationService';
import { useWeather } from '../../src/hooks/useWeather';
import { WeatherSettings } from '../../src/types';
import { getWeatherEmoji, getClothingSuggestion, formatTemp } from '../../src/utils/weatherClothing';

const NOTIFICATION_PRESETS = ['06:00', '06:30', '07:00', '07:30', '08:00'];

export default function WeatherSettingsScreen() {
  const uid = useAuthStore((s) => s.uid);
  const settings = useAuthStore((s) => s.settings);
  const setSettings = useAuthStore((s) => s.setSettings);
  const [weather, setWeather] = useState<WeatherSettings>(settings.weather);
  const { weather: currentWeather } = useWeather(settings.weather);

  const handleSave = async () => {
    if (!uid) return;
    try {
      const newSettings = { ...settings, weather };
      await updateUserSettings(uid, { weather });
      setSettings(newSettings);
      await clearWeatherCache();
      await scheduleWeatherNotification(weather);
      Alert.alert('保存完了', '天気設定を保存しました');
    } catch {
      Alert.alert('エラー', '天気設定の保存に失敗しました');
    }
  };

  const suggestion = currentWeather ? getClothingSuggestion(currentWeather) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 現在の天気プレビュー */}
      {currentWeather && (
        <Animated.View entering={FadeInDown.duration(300).springify()}>
          <Card>
            <View style={styles.previewHeader}>
              <Text style={styles.previewEmoji}>{getWeatherEmoji(currentWeather.icon)}</Text>
              <View>
                <Text style={styles.previewTemp}>{formatTemp(currentWeather.temp, weather.unit)}</Text>
                <Text style={styles.previewDesc}>{currentWeather.description}</Text>
              </View>
              <View style={styles.previewDetails}>
                <View style={styles.previewDetail}>
                  <Ionicons name="arrow-up" size={12} color="#e74c3c" />
                  <Text style={styles.previewDetailText}>{Math.round(currentWeather.tempMax)}°</Text>
                </View>
                <View style={styles.previewDetail}>
                  <Ionicons name="arrow-down" size={12} color="#3498db" />
                  <Text style={styles.previewDetailText}>{Math.round(currentWeather.tempMin)}°</Text>
                </View>
              </View>
            </View>
            {suggestion && (
              <View style={styles.previewSuggestion}>
                <Text style={styles.previewSuggestionIcon}>{suggestion.icon}</Text>
                <Text style={styles.previewSuggestionText}>{suggestion.message}</Text>
              </View>
            )}
            {suggestion?.rainWarning && (
              <View style={styles.previewRain}>
                <Text style={styles.previewRainText}>{suggestion.rainWarning}</Text>
              </View>
            )}
          </Card>
        </Animated.View>
      )}

      {/* 基本設定 */}
      <Animated.View entering={FadeInDown.delay(60).duration(300).springify()}>
        <Card>
          <View style={styles.cardHeader}>
            <Ionicons name="settings-outline" size={18} color="#3498db" />
            <Text style={styles.cardTitle}>基本設定</Text>
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Ionicons name="cloudy-outline" size={18} color="#4facfe" />
              <Text style={styles.label}>天気表示</Text>
            </View>
            <Switch
              value={weather.enabled}
              onValueChange={(enabled) => setWeather({ ...weather, enabled })}
              trackColor={{ false: '#e0e0e0', true: '#3498db' }}
            />
          </View>

          {weather.enabled && (
            <>
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Ionicons name="location-outline" size={18} color="#2ecc71" />
                  <Text style={styles.label}>位置情報を自動取得</Text>
                </View>
                <Switch
                  value={weather.autoLocation}
                  onValueChange={(autoLocation) => setWeather({ ...weather, autoLocation })}
                  trackColor={{ false: '#e0e0e0', true: '#3498db' }}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Ionicons name="thermometer-outline" size={18} color="#e67e22" />
                  <Text style={styles.label}>華氏表示 (°F)</Text>
                </View>
                <Switch
                  value={weather.unit === 'fahrenheit'}
                  onValueChange={(isFahrenheit) =>
                    setWeather({ ...weather, unit: isFahrenheit ? 'fahrenheit' : 'celsius' })
                  }
                  trackColor={{ false: '#e0e0e0', true: '#3498db' }}
                />
              </View>
            </>
          )}
        </Card>
      </Animated.View>

      {/* 通知設定 */}
      {weather.enabled && (
        <Animated.View entering={FadeInDown.delay(120).duration(300).springify()}>
          <Card>
            <View style={styles.cardHeader}>
              <Ionicons name="notifications-outline" size={18} color="#e67e22" />
              <Text style={styles.cardTitle}>朝の天気通知</Text>
            </View>
            <Text style={styles.notifDesc}>
              毎朝、天気と服装の提案を通知でお届けします
            </Text>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Ionicons name="alarm-outline" size={18} color="#e67e22" />
                <Text style={styles.label}>朝の天気通知</Text>
              </View>
              <Switch
                value={weather.morningNotification}
                onValueChange={(morningNotification) => setWeather({ ...weather, morningNotification })}
                trackColor={{ false: '#e0e0e0', true: '#e67e22' }}
              />
            </View>

            {weather.morningNotification && (
              <>
                <Text style={styles.timeLabel}>通知時刻</Text>
                <View style={styles.timePresets}>
                  {NOTIFICATION_PRESETS.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeChip,
                        weather.morningNotificationTime === time && styles.timeChipActive,
                      ]}
                      onPress={() => setWeather({ ...weather, morningNotificationTime: time })}
                    >
                      <Text
                        style={[
                          styles.timeChipText,
                          weather.morningNotificationTime === time && styles.timeChipTextActive,
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.input}
                  value={weather.morningNotificationTime}
                  onChangeText={(morningNotificationTime) => setWeather({ ...weather, morningNotificationTime })}
                  placeholder="カスタム時刻 (HH:MM)"
                  placeholderTextColor="#b0b8c8"
                />
              </>
            )}
          </Card>
        </Animated.View>
      )}

      {/* 服装提案の説明 */}
      {weather.enabled && (
        <Animated.View entering={FadeInDown.delay(180).duration(300).springify()}>
          <Card>
            <View style={styles.cardHeader}>
              <Ionicons name="shirt-outline" size={18} color="#9b59b6" />
              <Text style={styles.cardTitle}>服装提案について</Text>
            </View>
            <View style={styles.clothingInfo}>
              <View style={styles.clothingInfoRow}>
                <Text style={styles.clothingEmoji}>👕</Text>
                <Text style={styles.clothingRange}>25℃以上 — 半袖</Text>
              </View>
              <View style={styles.clothingInfoRow}>
                <Text style={styles.clothingEmoji}>🧥</Text>
                <Text style={styles.clothingRange}>15〜25℃ — 長袖・カーディガン</Text>
              </View>
              <View style={styles.clothingInfoRow}>
                <Text style={styles.clothingEmoji}>🧣</Text>
                <Text style={styles.clothingRange}>5〜15℃ — アウター・マフラー</Text>
              </View>
              <View style={styles.clothingInfoRow}>
                <Text style={styles.clothingEmoji}>🧤</Text>
                <Text style={styles.clothingRange}>5℃以下 — コート・防寒フル装備</Text>
              </View>
            </View>
            <Text style={styles.clothingNote}>
              予定がある場合、その時間帯の予報に基づいて提案します
            </Text>
          </Card>
        </Animated.View>
      )}

      {/* 保存ボタン */}
      <Animated.View entering={FadeInDown.delay(240).duration(300).springify()}>
        <View style={styles.saveContainer}>
          <Button title="保存" onPress={handleSave} />
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingVertical: 8, paddingBottom: 40 },
  // Preview
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewEmoji: { fontSize: 36 },
  previewTemp: { fontSize: 24, fontWeight: '800', color: '#2c3e50' },
  previewDesc: { fontSize: 13, color: '#7f8c8d', fontWeight: '600' },
  previewDetails: { marginLeft: 'auto', gap: 4 },
  previewDetail: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  previewDetailText: { fontSize: 13, fontWeight: '600', color: '#2c3e50' },
  previewSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: '#f0f7ff',
    padding: 10,
    borderRadius: 10,
  },
  previewSuggestionIcon: { fontSize: 18 },
  previewSuggestionText: { fontSize: 13, color: '#2c3e50', fontWeight: '600', flex: 1 },
  previewRain: {
    marginTop: 6,
    backgroundColor: '#ebf5fb',
    padding: 8,
    borderRadius: 8,
  },
  previewRainText: { fontSize: 12, color: '#3498db', fontWeight: '700' },
  // Card header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  // Settings
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#2c3e50' },
  // Notification
  notifDesc: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 12,
    marginBottom: 8,
  },
  timePresets: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f5f7fa',
  },
  timeChipActive: {
    backgroundColor: '#e67e22',
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  timeChipTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#f5f7fa',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#2c3e50',
  },
  // Clothing info
  clothingInfo: {
    gap: 8,
  },
  clothingInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clothingEmoji: { fontSize: 18 },
  clothingRange: { fontSize: 13, color: '#2c3e50', fontWeight: '500' },
  clothingNote: {
    fontSize: 11,
    color: '#95a5a6',
    marginTop: 12,
    lineHeight: 16,
  },
  // Save
  saveContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
});
