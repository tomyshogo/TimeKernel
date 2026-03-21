import React, { useEffect, useState } from 'react';
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import {
  getExternalCalendars,
  deleteExternalCalendar,
} from '../../src/services/externalCalendarService';
import { syncAllExternalCalendars } from '../../src/services/syncService';
import {
  ExternalCalendar,
  PROVIDER_LABELS,
  PROVIDER_COLORS,
} from '../../src/types';
import { useCalendars } from '../../src/hooks/useCalendars';

const PROVIDER_ICONS: Record<string, string> = {
  google: 'logo-google',
  apple: 'logo-apple',
  outlook: 'mail-outline',
  ical: 'link-outline',
};

export default function ExternalCalendarsScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.uid);
  const { calendars } = useCalendars();
  const [externalCals, setExternalCals] = useState<ExternalCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!uid) return;
    loadExternalCalendars();
  }, [uid]);

  const loadExternalCalendars = async () => {
    if (!uid) return;
    setLoading(true);
    const cals = await getExternalCalendars(uid);
    setExternalCals(cals);
    setLoading(false);
  };

  const handleDelete = async (cal: ExternalCalendar) => {
    if (!uid) return;
    Alert.alert(
      '連携を解除',
      `${cal.name} の連携を解除しますか？\nインポート済みの予定も削除されます。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '解除',
          style: 'destructive',
          onPress: async () => {
            await deleteExternalCalendar(uid, cal.id, calendars.map((c) => c.id));
            loadExternalCalendars();
          },
        },
      ]
    );
  };

  const handleSyncAll = async () => {
    if (!uid || calendars.length === 0) return;
    setSyncing(true);
    try {
      const targetCalendarId = calendars[0].id;
      const results = await syncAllExternalCalendars(uid, targetCalendarId);
      const totalImported = results.reduce((sum, r) => sum + r.importedCount, 0);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) {
        Alert.alert(
          '同期完了（一部エラー）',
          `${totalImported}件インポート\n${errors.map((e) => `${e.calendarName}: ${e.error}`).join('\n')}`
        );
      } else {
        Alert.alert('同期完了', `${totalImported}件のイベントをインポートしました`);
      }
      loadExternalCalendars();
    } catch (error: any) {
      Alert.alert('エラー', error.message || '同期に失敗しました');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  const services = [
    {
      key: 'google',
      name: 'Google Calendar',
      desc: 'Googleアカウントと予定を同期',
      icon: 'logo-google',
      color: '#4285F4',
      route: '/external-calendars/add-google',
    },
    {
      key: 'apple',
      name: 'Apple Calendar',
      desc: 'iPhoneのカレンダーと連携',
      icon: 'logo-apple',
      color: '#333',
      route: '/external-calendars/add-apple',
    },
    {
      key: 'ical',
      name: 'iCal URL',
      desc: 'URLからカレンダーを購読',
      icon: 'link-outline',
      color: '#8E8E93',
      route: '/external-calendars/add-ical',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 連携済み */}
      {externalCals.length > 0 && (
        <Animated.View entering={FadeInDown.duration(300).springify()}>
          <Card>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={18} color="#2ecc71" />
              <Text style={styles.sectionTitle}>連携済み</Text>
              <Text style={styles.sectionCount}>{externalCals.length}件</Text>
            </View>
            {externalCals.map((cal) => (
              <View key={cal.id} style={styles.calendarRow}>
                <View style={[styles.providerIcon, { backgroundColor: (PROVIDER_COLORS[cal.provider] || '#8E8E93') + '15' }]}>
                  <Ionicons
                    name={(PROVIDER_ICONS[cal.provider] || 'calendar-outline') as any}
                    size={18}
                    color={PROVIDER_COLORS[cal.provider] || '#8E8E93'}
                  />
                </View>
                <View style={styles.calendarInfo}>
                  <Text style={styles.calendarName}>{cal.name}</Text>
                  <Text style={styles.providerLabel}>
                    {cal.lastSynced
                      ? `最終同期: ${cal.lastSynced.toDate().toLocaleString('ja-JP')}`
                      : '未同期'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(cal)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="close-circle" size={22} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
              onPress={handleSyncAll}
              disabled={syncing}
              activeOpacity={0.7}
            >
              <Ionicons name="sync-outline" size={16} color={syncing ? '#95a5a6' : '#3498db'} />
              <Text style={[styles.syncButtonText, syncing && { color: '#95a5a6' }]}>
                {syncing ? '同期中...' : 'すべて同期'}
              </Text>
            </TouchableOpacity>
          </Card>
        </Animated.View>
      )}

      {/* カレンダーを追加 */}
      <Animated.View entering={FadeInDown.delay(externalCals.length > 0 ? 60 : 0).duration(300).springify()}>
        <Card>
          <View style={styles.sectionHeader}>
            <Ionicons name="add-circle-outline" size={18} color="#3498db" />
            <Text style={styles.sectionTitle}>カレンダーを追加</Text>
          </View>
          {services.map((svc, i) => (
            <TouchableOpacity
              key={svc.key}
              style={[styles.serviceRow, i < services.length - 1 && styles.serviceRowBorder]}
              onPress={() => router.push(svc.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.serviceIcon, { backgroundColor: svc.color + '12' }]}>
                <Ionicons name={svc.icon as any} size={22} color={svc.color} />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{svc.name}</Text>
                <Text style={styles.serviceDesc}>{svc.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#c0c8d4" />
            </TouchableOpacity>
          ))}
        </Card>
      </Animated.View>

      {/* 未連携時のヒント */}
      {externalCals.length === 0 && (
        <Animated.View entering={FadeInDown.delay(120).duration(300).springify()}>
          <View style={styles.hint}>
            <Ionicons name="information-circle-outline" size={16} color="#b0b8c8" />
            <Text style={styles.hintText}>
              外部カレンダーを連携すると、予定が自動で同期されます
            </Text>
          </View>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#95a5a6',
  },
  // 連携済み
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  providerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarInfo: {
    flex: 1,
  },
  calendarName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  providerLabel: {
    fontSize: 11,
    color: '#95a5a6',
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#f0f7ff',
  },
  syncButtonDisabled: {
    backgroundColor: '#f5f7fa',
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
  },
  // サービス一覧
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  serviceRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f2f5',
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
  },
  serviceDesc: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  hintText: {
    fontSize: 12,
    color: '#b0b8c8',
    flex: 1,
  },
});
