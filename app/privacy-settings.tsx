import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../src/components/ui/Card';
import { Button } from '../src/components/ui/Button';
import { useAuthStore } from '../src/stores/authStore';
import { EventVisibility } from '../src/types';

const VISIBILITY_OPTIONS: { value: EventVisibility; label: string; desc: string }[] = [
  { value: 'public', label: '公開', desc: '全詳細を共有メンバーに公開' },
  { value: 'title_only', label: 'タイトルのみ', desc: 'タイトルと時刻のみ表示、詳細は非公開' },
  { value: 'private', label: '非公開', desc: '「予定あり」とだけ表示' },
];

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.uid);
  const [defaultVisibility, setDefaultVisibility] = useState<EventVisibility>('public');

  const handleDeleteAccount = () => {
    Alert.alert(
      'アカウント削除',
      'アカウントを削除すると、全てのデータが完全に削除されます。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => {
            Alert.alert('確認', '本当に削除しますか？', [
              { text: 'キャンセル', style: 'cancel' },
              {
                text: '完全に削除',
                style: 'destructive',
                onPress: async () => {
                  // TODO: Cloud Function経由で全データ削除 + Firebase Auth削除
                  Alert.alert('削除処理を開始しました');
                },
              },
            ]);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.sectionTitle}>デフォルト公開レベル</Text>
        <Text style={styles.desc}>
          新規予定作成時のデフォルト公開レベルを設定します。
        </Text>
        {VISIBILITY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.option,
              defaultVisibility === opt.value && styles.optionActive,
            ]}
            onPress={() => setDefaultVisibility(opt.value)}
          >
            <Text
              style={[
                styles.optionLabel,
                defaultVisibility === opt.value && styles.optionLabelActive,
              ]}
            >
              {opt.label}
            </Text>
            <Text style={styles.optionDesc}>{opt.desc}</Text>
          </TouchableOpacity>
        ))}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>データについて</Text>
        <Text style={styles.desc}>
          予定データはFirestoreに保存され、セキュリティルールにより他ユーザーの非公開予定へのアクセスは制限されています。
          共有カレンダーでは公開レベルに応じた情報のみが他メンバーに表示されます。
        </Text>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: '#e74c3c' }]}>
          アカウント削除
        </Text>
        <Text style={styles.desc}>
          アカウントを削除すると、全ての個人データ（予定、時間割、課題、勉強記録）が完全に削除されます。
        </Text>
        <Button
          title="アカウントを削除"
          variant="secondary"
          onPress={handleDeleteAccount}
          style={{ marginTop: 12 }}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingVertical: 8, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 8 },
  desc: { fontSize: 13, color: '#7f8c8d', lineHeight: 18, marginBottom: 8 },
  option: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  optionActive: {
    borderColor: '#3498db',
    backgroundColor: 'rgba(52, 152, 219, 0.05)',
  },
  optionLabel: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
  optionLabelActive: { color: '#3498db' },
  optionDesc: { fontSize: 12, color: '#95a5a6', marginTop: 2 },
});
