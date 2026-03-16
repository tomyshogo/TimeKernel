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
      `${cal.name} の連携を解除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '解除',
          style: 'destructive',
          onPress: async () => {
            await deleteExternalCalendar(uid, cal.id);
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
      const results = await syncAllExternalCalendars(uid, calendars[0].id);
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.sectionTitle}>連携済みカレンダー</Text>
        {externalCals.length === 0 ? (
          <Text style={styles.emptyText}>
            外部カレンダーが連携されていません
          </Text>
        ) : (
          externalCals.map((cal) => (
            <View key={cal.id} style={styles.calendarRow}>
              <View style={[styles.providerDot, { backgroundColor: cal.color }]} />
              <View style={styles.calendarInfo}>
                <Text style={styles.calendarName}>{cal.name}</Text>
                <Text style={styles.providerLabel}>
                  {PROVIDER_LABELS[cal.provider]}
                  {cal.lastSynced
                    ? ` ・ 最終同期: ${cal.lastSynced.toDate().toLocaleString('ja-JP')}`
                    : ' ・ 未同期'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(cal)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteText}>解除</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>カレンダーを追加</Text>
        <Button
          title="Google Calendar を連携"
          onPress={() => router.push('/external-calendars/add-google')}
          style={{ marginBottom: 8 }}
        />
        <Button
          title="Apple Calendar を連携"
          variant="secondary"
          onPress={() => router.push('/external-calendars/add-apple')}
          style={{ marginBottom: 8 }}
        />
        <Button
          title="iCal URLを追加"
          variant="secondary"
          onPress={() => router.push('/external-calendars/add-ical')}
        />
      </Card>

      {externalCals.length > 0 && (
        <View style={styles.syncButton}>
          <Button
            title={syncing ? '同期中...' : 'すべて同期'}
            onPress={handleSyncAll}
            disabled={syncing}
          />
        </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    paddingVertical: 16,
  },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  providerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  calendarInfo: {
    flex: 1,
  },
  calendarName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  providerLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteText: {
    fontSize: 13,
    color: '#e74c3c',
    fontWeight: '600',
  },
  syncButton: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
});
