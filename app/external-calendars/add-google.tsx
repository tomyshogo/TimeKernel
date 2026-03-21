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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/ui/Card';
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
      {/* ステップ表示 */}
      <Animated.View entering={FadeInDown.duration(300).springify()}>
        <View style={styles.steps}>
          <View style={[styles.step, styles.stepActive]}>
            <View style={[styles.stepCircle, calendars.length > 0 && styles.stepDone]}>
              {calendars.length > 0 ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <Text style={styles.stepNumber}>1</Text>
              )}
            </View>
            <Text style={styles.stepLabel}>ログイン</Text>
          </View>
          <View style={[styles.stepLine, calendars.length > 0 && styles.stepLineDone]} />
          <View style={styles.step}>
            <View style={[styles.stepCircle, calendars.length > 0 && styles.stepActive && styles.stepCircleActive]}>
              <Text style={[styles.stepNumber, calendars.length > 0 && styles.stepNumberActive]}>2</Text>
            </View>
            <Text style={styles.stepLabel}>選択</Text>
          </View>
        </View>
      </Animated.View>

      {calendars.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(60).duration(300).springify()}>
          <Card>
            <View style={styles.googleHeader}>
              <View style={styles.googleIconCircle}>
                <Ionicons name="logo-google" size={28} color="#4285F4" />
              </View>
              <Text style={styles.title}>Google Calendar</Text>
              <Text style={styles.description}>
                Googleアカウントにログインして、カレンダーを同期します
              </Text>
            </View>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Ionicons name="sync-outline" size={18} color="#4285F4" />
                <Text style={styles.featureText}>予定の自動同期</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="notifications-outline" size={18} color="#4285F4" />
                <Text style={styles.featureText}>変更をリアルタイム反映</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#4285F4" />
                <Text style={styles.featureText}>安全なOAuth認証</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.googleButton, loading && styles.googleButtonDisabled]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#fff" />
                  <Text style={styles.googleButtonText}>Googleでログイン</Text>
                </>
              )}
            </TouchableOpacity>
          </Card>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.delay(60).duration(300).springify()}>
          <Card>
            <View style={styles.selectHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#2ecc71" />
              <Text style={styles.selectTitle}>ログイン完了</Text>
            </View>
            <Text style={styles.selectDesc}>
              連携するカレンダーをタップしてください
            </Text>
            {calendars.map((cal, i) => (
              <Animated.View key={cal.id} entering={FadeInDown.delay(i * 50).duration(200)}>
                <TouchableOpacity
                  style={styles.calendarRow}
                  onPress={() => handleSelectCalendar(cal)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.colorDot, { backgroundColor: cal.backgroundColor }]} />
                  <Text style={styles.calendarName}>{cal.summary}</Text>
                  <Ionicons name="add-circle-outline" size={22} color="#4285F4" />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Card>
        </Animated.View>
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
  // Steps
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 40,
    gap: 0,
  },
  step: {
    alignItems: 'center',
    gap: 4,
  },
  stepActive: {},
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#4285F4',
  },
  stepDone: {
    backgroundColor: '#2ecc71',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#95a5a6',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
    marginBottom: 18,
  },
  stepLineDone: {
    backgroundColor: '#2ecc71',
  },
  // Login card
  googleHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  googleIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 18,
  },
  featureList: {
    gap: 10,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#4285F4',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  // Select card
  selectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  selectTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2ecc71',
  },
  selectDesc: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f2f5',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  calendarName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
});
