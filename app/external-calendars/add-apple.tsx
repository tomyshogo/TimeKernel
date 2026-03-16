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
import { useAuthStore } from '../../src/stores/authStore';
import { fetchDeviceCalendars } from '../../src/services/appleCalendarService';
import { addExternalCalendar } from '../../src/services/externalCalendarService';

export default function AddAppleCalendarScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.uid);
  const [loading, setLoading] = useState(true);
  const [deviceCalendars, setDeviceCalendars] = useState<
    { id: string; title: string; color: string; source: string }[]
  >([]);

  useEffect(() => {
    loadCalendars();
  }, []);

  const loadCalendars = async () => {
    const cals = await fetchDeviceCalendars();
    setDeviceCalendars(cals);
    setLoading(false);
  };

  const handleSelect = async (cal: {
    id: string;
    title: string;
    color: string;
    source: string;
  }) => {
    if (!uid) return;
    try {
      await addExternalCalendar(uid, {
        provider: 'apple',
        name: `${cal.source} - ${cal.title}`,
        color: cal.color,
        syncEnabled: true,
        syncDirection: 'both',
        lastSynced: null,
        appleCalendarId: cal.id,
        exportTypes: ['class', 'event', 'shift'],
      });
      Alert.alert('連携完了', `${cal.title} を連携しました`);
      router.back();
    } catch (error: any) {
      Alert.alert('エラー', error.message || '連携に失敗しました');
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
        <Text style={styles.sectionTitle}>Apple Calendar 連携</Text>
        <Text style={styles.description}>
          デバイスのカレンダーを選択して連携します
        </Text>
        {deviceCalendars.length === 0 ? (
          <Text style={styles.emptyText}>
            カレンダーが見つかりません。設定からカレンダーへのアクセスを許可してください。
          </Text>
        ) : (
          deviceCalendars.map((cal) => (
            <TouchableOpacity
              key={cal.id}
              style={styles.calendarRow}
              onPress={() => handleSelect(cal)}
            >
              <View
                style={[styles.colorDot, { backgroundColor: cal.color }]}
              />
              <View>
                <Text style={styles.calendarName}>{cal.title}</Text>
                <Text style={styles.sourceLabel}>{cal.source}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </Card>
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
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 16,
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
  sourceLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
});
