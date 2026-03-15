import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { joinCalendar } from '../../src/services/calendarService';
import { getOrCreateUser } from '../../src/services/userService';
import { extractCalendarIdFromLink } from '../../src/services/shareService';

export default function JoinCalendarScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.uid);
  const setProfile = useAuthStore((s) => s.setProfile);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!uid || !input.trim()) return;

    const calendarId = extractCalendarIdFromLink(input.trim()) || input.trim();
    setLoading(true);
    try {
      const success = await joinCalendar(calendarId, uid);
      if (success) {
        const updatedProfile = await getOrCreateUser(uid);
        setProfile(updatedProfile);
        router.back();
      } else {
        Alert.alert('エラー', 'カレンダーが見つかりません');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        共有リンクまたはカレンダーIDを入力してください
      </Text>
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        placeholder="リンクまたはID"
        autoFocus
      />
      <Button
        title="参加"
        onPress={handleJoin}
        loading={loading}
        disabled={!input.trim()}
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
  description: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 16,
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
