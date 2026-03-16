import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { Card } from '../src/components/ui/Card';
import { Button } from '../src/components/ui/Button';
import { useAuthStore } from '../src/stores/authStore';
import { updateUserSettings } from '../src/services/userService';
import { NotificationSettings, DEFAULT_NOTIFICATION_SETTINGS } from '../src/types';

export default function NotificationSettingsScreen() {
  const uid = useAuthStore((s) => s.uid);
  const settings = useAuthStore((s) => s.settings);
  const setSettings = useAuthStore((s) => s.setSettings);

  const notifSettings = settings.notifications || DEFAULT_NOTIFICATION_SETTINGS;
  const [notif, setNotif] = useState<NotificationSettings>(notifSettings);

  const handleSave = async () => {
    if (!uid) return;

    // バリデーション
    if (notif.reminderMinutes < 0 || notif.reminderMinutes > 1440) {
      Alert.alert('入力エラー', 'リマインダーは0〜1440分の範囲で設定してください');
      return;
    }
    if (notif.quietHours.enabled) {
      const timePattern = /^\d{1,2}:\d{2}$/;
      if (!timePattern.test(notif.quietHours.start) || !timePattern.test(notif.quietHours.end)) {
        Alert.alert('入力エラー', 'おやすみ時間はHH:MM形式で入力してください');
        return;
      }
    }

    try {
      const newSettings = { ...settings, notifications: notif };
      await updateUserSettings(uid, { notifications: notif });
      setSettings(newSettings);
      Alert.alert('保存しました');
    } catch {
      Alert.alert('エラー', '通知設定の保存に失敗しました');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.sectionTitle}>通知設定</Text>

        <View style={styles.switchRow}>
          <Text style={styles.label}>通知を有効にする</Text>
          <Switch
            value={notif.enabled}
            onValueChange={(enabled) => setNotif({ ...notif, enabled })}
          />
        </View>
      </Card>

      {notif.enabled && (
        <>
          <Card>
            <Text style={styles.sectionTitle}>イベントタイプ別</Text>

            <View style={styles.switchRow}>
              <Text style={styles.label}>授業</Text>
              <Switch
                value={notif.eventTypes.class}
                onValueChange={(v) =>
                  setNotif({
                    ...notif,
                    eventTypes: { ...notif.eventTypes, class: v },
                  })
                }
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>予定</Text>
              <Switch
                value={notif.eventTypes.event}
                onValueChange={(v) =>
                  setNotif({
                    ...notif,
                    eventTypes: { ...notif.eventTypes, event: v },
                  })
                }
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>バイト</Text>
              <Switch
                value={notif.eventTypes.shift}
                onValueChange={(v) =>
                  setNotif({
                    ...notif,
                    eventTypes: { ...notif.eventTypes, shift: v },
                  })
                }
              />
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>リマインダー</Text>
            <Text style={styles.description}>
              予定の何分前に通知するか設定します
            </Text>
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                value={String(notif.reminderMinutes)}
                onChangeText={(t) => {
                  const n = parseInt(t, 10);
                  if (n >= 0) setNotif({ ...notif, reminderMinutes: n });
                }}
                keyboardType="numeric"
              />
              <Text style={styles.unit}>分前</Text>
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>おやすみ時間</Text>
            <Text style={styles.description}>
              この時間帯は通知を送りません
            </Text>

            <View style={styles.switchRow}>
              <Text style={styles.label}>おやすみ時間を有効にする</Text>
              <Switch
                value={notif.quietHours.enabled}
                onValueChange={(enabled) =>
                  setNotif({
                    ...notif,
                    quietHours: { ...notif.quietHours, enabled },
                  })
                }
              />
            </View>

            {notif.quietHours.enabled && (
              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <Text style={styles.label}>開始</Text>
                  <TextInput
                    style={styles.input}
                    value={notif.quietHours.start}
                    onChangeText={(start) =>
                      setNotif({
                        ...notif,
                        quietHours: { ...notif.quietHours, start },
                      })
                    }
                    placeholder="23:00"
                  />
                </View>
                <View style={styles.timeField}>
                  <Text style={styles.label}>終了</Text>
                  <TextInput
                    style={styles.input}
                    value={notif.quietHours.end}
                    onChangeText={(end) =>
                      setNotif({
                        ...notif,
                        quietHours: { ...notif.quietHours, end },
                      })
                    }
                    placeholder="07:00"
                  />
                </View>
              </View>
            )}
          </Card>
        </>
      )}

      <View style={styles.saveButton}>
        <Button title="設定を保存" onPress={handleSave} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  description: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 80,
  },
  unit: {
    fontSize: 14,
    color: '#2c3e50',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  timeField: {
    flex: 1,
  },
  saveButton: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
});
