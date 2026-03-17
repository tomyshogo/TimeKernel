import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Switch } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/stores/authStore';
import { updateUserSettings } from '../../src/services/userService';
import { clearWeatherCache } from '../../src/services/weatherService';
import { scheduleWeatherNotification } from '../../src/services/weatherNotificationService';
import { WeatherSettings } from '../../src/types';
import { toast } from '../../src/components/ui/Toast';

export default function WeatherSettingsScreen() {
  const uid = useAuthStore((s) => s.uid);
  const settings = useAuthStore((s) => s.settings);
  const setSettings = useAuthStore((s) => s.setSettings);
  const [weather, setWeather] = useState<WeatherSettings>(settings.weather);

  const handleSave = async () => {
    if (!uid) return;
    try {
      const newSettings = { ...settings, weather };
      await updateUserSettings(uid, { weather });
      setSettings(newSettings);
      await clearWeatherCache();
      await scheduleWeatherNotification(weather);
      toast.success('天気設定を保存しました');
    } catch {
      toast.error('天気設定の保存に失敗しました');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <View style={styles.switchRow}>
          <Text style={styles.label}>天気表示</Text>
          <Switch
            value={weather.enabled}
            onValueChange={(enabled) => setWeather({ ...weather, enabled })}
          />
        </View>
        {weather.enabled && (
          <>
            <View style={styles.switchRow}>
              <Text style={styles.label}>位置情報を自動取得</Text>
              <Switch
                value={weather.autoLocation}
                onValueChange={(autoLocation) => setWeather({ ...weather, autoLocation })}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.label}>朝の天気通知</Text>
              <Switch
                value={weather.morningNotification}
                onValueChange={(morningNotification) => setWeather({ ...weather, morningNotification })}
              />
            </View>
            {weather.morningNotification && (
              <>
                <Text style={styles.label}>通知時刻</Text>
                <TextInput
                  style={styles.input}
                  value={weather.morningNotificationTime}
                  onChangeText={(morningNotificationTime) => setWeather({ ...weather, morningNotificationTime })}
                  placeholder="07:00"
                />
              </>
            )}
            <View style={styles.switchRow}>
              <Text style={styles.label}>華氏表示</Text>
              <Switch
                value={weather.unit === 'fahrenheit'}
                onValueChange={(isFahrenheit) =>
                  setWeather({ ...weather, unit: isFahrenheit ? 'fahrenheit' : 'celsius' })
                }
              />
            </View>
          </>
        )}
        <Button title="保存" onPress={handleSave} style={{ marginTop: 16 }} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingVertical: 8, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: '#2c3e50', marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
});
