import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Switch } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/stores/authStore';
import { updateUserSettings } from '../../src/services/userService';
import { toast } from '../../src/components/ui/Toast';

export default function NightShiftSettingsScreen() {
  const uid = useAuthStore((s) => s.uid);
  const settings = useAuthStore((s) => s.settings);
  const setSettings = useAuthStore((s) => s.setSettings);
  const [nightShift, setNightShift] = useState(settings.nightShift);

  const handleSave = async () => {
    if (!uid) return;
    try {
      const newSettings = { ...settings, nightShift };
      await updateUserSettings(uid, { nightShift });
      setSettings(newSettings);
      toast.success('深夜割増設定を保存しました');
    } catch {
      toast.error('深夜割増設定の保存に失敗しました');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <View style={styles.switchRow}>
          <Text style={styles.label}>深夜割増を有効にする</Text>
          <Switch
            value={nightShift.enabled}
            onValueChange={(enabled) => setNightShift({ ...nightShift, enabled })}
          />
        </View>
        {nightShift.enabled && (
          <>
            <Text style={styles.label}>割増開始時刻</Text>
            <TextInput
              style={styles.input}
              value={nightShift.startTime}
              onChangeText={(startTime) => setNightShift({ ...nightShift, startTime })}
              placeholder="22:00"
            />
            <Text style={styles.label}>割増倍率</Text>
            <TextInput
              style={styles.input}
              value={nightShift.multiplier.toString()}
              onChangeText={(v) =>
                setNightShift({ ...nightShift, multiplier: parseFloat(v) || 1.25 })
              }
              placeholder="1.25"
              keyboardType="numeric"
            />
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
