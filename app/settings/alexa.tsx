import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { updateUserSettings } from '../../src/services/userService';

export default function AlexaSettingsScreen() {
  const uid = useAuthStore((s) => s.uid);
  const settings = useAuthStore((s) => s.settings);
  const setSettings = useAuthStore((s) => s.setSettings);
  const [alexaSync, setAlexaSync] = useState(settings.alexaSync ?? false);

  const handleSave = async () => {
    if (!uid) return;
    try {
      const newSettings = { ...settings, alexaSync };
      await updateUserSettings(uid, { alexaSync });
      setSettings(newSettings);
      Alert.alert('保存完了', alexaSync
        ? '外部連携を有効にしました。個人カレンダーのイベントがAlexaやClaudeから確認できるようになります。'
        : '外部連携を無効にしました。'
      );
    } catch {
      Alert.alert('エラー', '設定の保存に失敗しました');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(300).springify()}>
        <Card>
          <View style={styles.headerRow}>
            <View style={styles.alexaIcon}>
              <Ionicons name="mic-outline" size={28} color="#00caff" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>外部連携（Alexa / Claude）</Text>
              <Text style={styles.desc}>
                Amazon AlexaやClaude（MCP）から予定の確認・追加ができます
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(300).springify()}>
        <Card>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>データ同期を有効にする</Text>
              <Text style={styles.switchDesc}>
                ONにすると個人カレンダーのイベントがクラウドにも保存され、AlexaやClaudeから確認できます
              </Text>
            </View>
            <Switch
              value={alexaSync}
              onValueChange={setAlexaSync}
              trackColor={{ false: '#e0e0e0', true: '#00caff' }}
            />
          </View>
          <Button title="保存" onPress={handleSave} style={{ marginTop: 16 }} />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(300).springify()}>
        <Card>
          <Text style={styles.sectionTitle}>使えるコマンド</Text>
          <View style={styles.commandList}>
            <CommandRow command="今日の予定を教えて" desc="今日のイベント一覧" />
            <CommandRow command="明日の予定" desc="指定日のイベント" />
            <CommandRow command="次の予定は" desc="この後の次のイベント" />
            <CommandRow command="予定を追加して" desc="対話形式で予定追加" />
            <CommandRow command="今月のバイト代は" desc="月間バイト集計" />
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).duration(300).springify()}>
        <Card>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#2ecc71" />
            <Text style={styles.sectionTitle}>プライバシー</Text>
          </View>
          <Text style={styles.privacyText}>
            ・データ同期がOFFの場合、個人カレンダーのデータはデバイス内にのみ保存されます
          </Text>
          <Text style={styles.privacyText}>
            ・ONにした場合、イベントデータがクラウドに同期され、AlexaやClaudeからアクセスできます
          </Text>
          <Text style={styles.privacyText}>
            ・いつでもOFFに切り替えてクラウドの同期を停止できます
          </Text>
        </Card>
      </Animated.View>
    </ScrollView>
  );
}

function CommandRow({ command, desc }: { command: string; desc: string }) {
  return (
    <View style={styles.commandRow}>
      <Text style={styles.commandQuote}>「{command}」</Text>
      <Text style={styles.commandDesc}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingVertical: 8, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  alexaIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#00caff12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: '#2c3e50' },
  desc: { fontSize: 13, color: '#7f8c8d', marginTop: 4 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  label: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
  switchDesc: { fontSize: 12, color: '#95a5a6', marginTop: 4, maxWidth: '80%' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#2c3e50', marginBottom: 8 },
  commandList: { gap: 8 },
  commandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f2f5',
  },
  commandQuote: { fontSize: 13, fontWeight: '600', color: '#00caff' },
  commandDesc: { fontSize: 12, color: '#95a5a6' },
  privacyText: { fontSize: 12, color: '#7f8c8d', lineHeight: 18, marginBottom: 4 },
});
