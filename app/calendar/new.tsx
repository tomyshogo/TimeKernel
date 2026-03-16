import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { createCalendar } from '../../src/services/calendarService';
import { getOrCreateUser } from '../../src/services/userService';

export default function NewCalendarScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.uid);
  const setProfile = useAuthStore((s) => s.setProfile);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!uid || !name.trim()) return;
    setLoading(true);
    try {
      await createCalendar(name.trim(), uid);
      const { profile: updatedProfile } = await getOrCreateUser(uid);
      setProfile(updatedProfile);
      router.back();
    } catch {
      Alert.alert('エラー', 'カレンダーの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>カレンダー名</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="例: 俺と彼女"
        autoFocus
      />
      <Button
        title="作成"
        onPress={handleCreate}
        loading={loading}
        disabled={!name.trim()}
        style={{ marginTop: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});
