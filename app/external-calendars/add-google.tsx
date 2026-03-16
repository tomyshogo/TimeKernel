import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import {
  authenticateGoogle,
  fetchGoogleCalendarList,
} from '../../src/services/googleCalendarService';
import { addExternalCalendar } from '../../src/services/externalCalendarService';
import { PROVIDER_COLORS } from '../../src/types';

export default function AddGoogleCalendarScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.uid);
  const [loading, setLoading] = useState(false);
  const [calendars, setCalendars] = useState<
    { id: string; summary: string; backgroundColor: string }[]
  >([]);
  const [tokens, setTokens] = useState<{
    accessToken: string;
    refreshToken?: string;
  } | null>(null);

  const handleAuth = async () => {
    setLoading(true);
    try {
      const result = await authenticateGoogle();
      if (!result) {
        Alert.alert('キャンセル', '認証がキャンセルされました');
        setLoading(false);
        return;
      }
      setTokens(result);
      const cals = await fetchGoogleCalendarList(result.accessToken);
      setCalendars(cals);
    } catch (error: any) {
      Alert.alert('エラー', error.message || 'Google認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCalendar = async (cal: {
    id: string;
    summary: string;
    backgroundColor: string;
  }) => {
    if (!uid || !tokens) return;
    try {
      await addExternalCalendar(uid, {
        provider: 'google',
        name: `Google - ${cal.summary}`,
        color: cal.backgroundColor || PROVIDER_COLORS.google,
        syncEnabled: true,
        syncDirection: 'both',
        lastSynced: null,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        googleCalendarId: cal.id,
        exportTypes: ['class', 'event', 'shift'],
      });
      Alert.alert('連携完了', `${cal.summary} を連携しました`);
      router.back();
    } catch (error: any) {
      Alert.alert('エラー', error.message || '連携に失敗しました');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {calendars.length === 0 ? (
        <Card>
          <Text style={styles.sectionTitle}>Google Calendar 連携</Text>
          <Text style={styles.description}>
            Googleアカウントにログインして、連携するカレンダーを選択します。
          </Text>
          <Button
            title={loading ? '認証中...' : 'Googleでログイン'}
            onPress={handleAuth}
            disabled={loading}
          />
          {loading && (
            <ActivityIndicator
              size="small"
              color="#3498db"
              style={{ marginTop: 12 }}
            />
          )}
        </Card>
      ) : (
        <Card>
          <Text style={styles.sectionTitle}>カレンダーを選択</Text>
          <Text style={styles.description}>
            連携するカレンダーをタップしてください
          </Text>
          {calendars.map((cal) => (
            <TouchableOpacity
              key={cal.id}
              style={styles.calendarRow}
              onPress={() => handleSelectCalendar(cal)}
            >
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: cal.backgroundColor },
                ]}
              />
              <Text style={styles.calendarName}>{cal.summary}</Text>
            </TouchableOpacity>
          ))}
        </Card>
      )}
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
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  calendarName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
});
