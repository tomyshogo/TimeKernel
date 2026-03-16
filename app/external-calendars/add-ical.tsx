import React, { useState } from 'react';
import {
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { addExternalCalendar } from '../../src/services/externalCalendarService';
import { PROVIDER_COLORS } from '../../src/types';

export default function AddICalScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.uid);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const handleAdd = async () => {
    if (!uid || !name.trim() || !url.trim()) {
      Alert.alert('入力エラー', '名前とURLを入力してください');
      return;
    }

    // URL形式の簡易チェック
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('webcal://')) {
      Alert.alert('入力エラー', '有効なURLを入力してください');
      return;
    }

    const normalizedUrl = url.replace(/^webcal:\/\//, 'https://');

    try {
      await addExternalCalendar(uid, {
        provider: 'ical',
        name: name.trim(),
        color: PROVIDER_COLORS.ical,
        syncEnabled: true,
        syncDirection: 'import',
        lastSynced: null,
        icalUrl: normalizedUrl,
        exportTypes: [],
      });
      Alert.alert('追加完了', `${name.trim()} を追加しました`);
      router.back();
    } catch (error: any) {
      Alert.alert('エラー', error.message || '追加に失敗しました');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.sectionTitle}>iCal URL 購読</Text>
        <Text style={styles.description}>
          iCal形式のURLを入力すると、定期的にイベントを取り込みます。
          webcal:// でも https:// でも対応しています。
        </Text>

        <Text style={styles.label}>カレンダー名</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="例: 大学の講義カレンダー"
        />

        <Text style={styles.label}>URL</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="https://example.com/calendar.ics"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Button
          title="追加"
          onPress={handleAdd}
          style={{ marginTop: 16 }}
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
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});
