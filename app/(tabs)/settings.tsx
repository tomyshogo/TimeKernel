import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { PeriodEditor } from '../../src/components/timetable/PeriodEditor';
import { Card } from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/stores/authStore';
import { updateUserName, updateUserSettings } from '../../src/services/userService';
import { sendEmailLink } from '../../src/services/auth';
import { Period, NightShiftSettings } from '../../src/types';

export default function SettingsScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.uid);
  const profile = useAuthStore((s) => s.profile);
  const settings = useAuthStore((s) => s.settings);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setSettings = useAuthStore((s) => s.setSettings);

  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState('');
  const [periods, setPeriods] = useState(settings.periods);
  const [nightShift, setNightShift] = useState(settings.nightShift);

  const handleSaveName = async () => {
    if (!uid || !name.trim()) return;
    try {
      await updateUserName(uid, name.trim());
      setProfile({ ...profile!, name: name.trim() });
      Alert.alert('保存しました');
    } catch {
      Alert.alert('エラー', '名前の保存に失敗しました');
    }
  };

  const handleSendEmailLink = async () => {
    if (!email.trim()) return;
    try {
      await sendEmailLink(email.trim());
      Alert.alert('メールを送信しました', 'メール内のリンクをタップしてください');
    } catch {
      Alert.alert('エラー', 'メール送信に失敗しました');
    }
  };

  const handleSavePeriods = async () => {
    if (!uid) return;
    try {
      const newSettings = { ...settings, periods };
      await updateUserSettings(uid, { periods });
      setSettings(newSettings);
      Alert.alert('時限設定を保存しました');
    } catch {
      Alert.alert('エラー', '時限設定の保存に失敗しました');
    }
  };

  const handleSaveNightShift = async () => {
    if (!uid) return;
    try {
      const newSettings = { ...settings, nightShift };
      await updateUserSettings(uid, { nightShift });
      setSettings(newSettings);
      Alert.alert('深夜割増設定を保存しました');
    } catch {
      Alert.alert('エラー', '深夜割増設定の保存に失敗しました');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.sectionTitle}>プロフィール</Text>
        <Text style={styles.label}>名前</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="名前を入力"
        />
        <Button title="名前を保存" onPress={handleSaveName} style={{ marginTop: 8 }} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>メールリンク認証（データ引き継ぎ用）</Text>
        <Text style={styles.description}>
          メールアドレスを登録すると、端末変更時にデータを引き継げます
        </Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="example@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Button
          title="認証メールを送信"
          onPress={handleSendEmailLink}
          variant="secondary"
          style={{ marginTop: 8 }}
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>時限設定</Text>
        <PeriodEditor periods={periods} onUpdate={setPeriods} />
        <Button
          title="時限設定を保存"
          onPress={handleSavePeriods}
          style={{ marginTop: 12 }}
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>深夜割増設定</Text>
        <View style={styles.switchRow}>
          <Text style={styles.label}>深夜割増を有効にする</Text>
          <Switch
            value={nightShift.enabled}
            onValueChange={(enabled) =>
              setNightShift({ ...nightShift, enabled })
            }
          />
        </View>
        {nightShift.enabled && (
          <>
            <Text style={styles.label}>割増開始時刻</Text>
            <TextInput
              style={styles.input}
              value={nightShift.startTime}
              onChangeText={(startTime) =>
                setNightShift({ ...nightShift, startTime })
              }
              placeholder="22:00"
            />
            <Text style={styles.label}>割増倍率</Text>
            <TextInput
              style={styles.input}
              value={nightShift.multiplier.toString()}
              onChangeText={(v) =>
                setNightShift({
                  ...nightShift,
                  multiplier: parseFloat(v) || 1.25,
                })
              }
              placeholder="1.25"
              keyboardType="numeric"
            />
          </>
        )}
        <Button
          title="深夜割増設定を保存"
          onPress={handleSaveNightShift}
          style={{ marginTop: 12 }}
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>通知設定</Text>
        <Button
          title="通知・リマインダー設定"
          variant="secondary"
          onPress={() => router.push('/notification-settings')}
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>外部カレンダー連携</Text>
        <Button
          title="外部カレンダー管理"
          variant="secondary"
          onPress={() => router.push('/external-calendars')}
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>カレンダー管理</Text>
        <Button
          title="カレンダー一覧"
          variant="secondary"
          onPress={() => router.push('/calendar')}
        />
      </Card>
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
    marginTop: 8,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
