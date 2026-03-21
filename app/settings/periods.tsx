import React, { useState } from 'react';
import { StyleSheet, ScrollView, Text, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '../../src/components/ui/Button';
import { PeriodEditor } from '../../src/components/timetable/PeriodEditor';
import { Card } from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/stores/authStore';
import { updateUserSettings } from '../../src/services/userService';
import { toast } from '../../src/components/ui/Toast';

export default function PeriodSettingsScreen() {
  const uid = useAuthStore((s) => s.uid);
  const settings = useAuthStore((s) => s.settings);
  const setSettings = useAuthStore((s) => s.setSettings);
  const [periods, setPeriods] = useState(settings.periods);

  const handleSave = async () => {
    if (!uid) return;
    try {
      const newSettings = { ...settings, periods };
      await updateUserSettings(uid, { periods });
      setSettings(newSettings);
      Alert.alert('保存完了', '時限設定を保存しました');
    } catch {
      Alert.alert('エラー', '時限設定の保存に失敗しました');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.delay(0 * 60).duration(300).springify()}>
        <Card>
          <Text style={styles.sectionTitle}>時限設定</Text>
          <Text style={styles.description}>各時限の開始・終了時間を設定します</Text>
          <PeriodEditor periods={periods} onUpdate={setPeriods} />
          <Button title="保存" onPress={handleSave} style={{ marginTop: 12 }} />
        </Card>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingVertical: 8, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 8 },
  description: { fontSize: 13, color: '#7f8c8d', marginBottom: 12 },
});
