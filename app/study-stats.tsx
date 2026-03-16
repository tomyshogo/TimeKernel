import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Card } from '../src/components/ui/Card';
import { useAuthStore } from '../src/stores/authStore';
import {
  getStudyRecords,
  summarizeStudyRecords,
  StudySummary,
} from '../src/services/studyService';

type Period = 'today' | 'week' | 'month';

export default function StudyStatsScreen() {
  const uid = useAuthStore((s) => s.uid);
  const [period, setPeriod] = useState<Period>('week');
  const [summary, setSummary] = useState<StudySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    loadStats();
  }, [uid, period]);

  const loadStats = async () => {
    if (!uid) return;
    setLoading(true);

    const now = new Date();
    let startDate: string;
    const endDate = now.toISOString().split('T')[0];

    switch (period) {
      case 'today':
        startDate = endDate;
        break;
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      }
      case 'month': {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      }
    }

    const records = await getStudyRecords(uid, startDate, endDate);
    setSummary(summarizeStudyRecords(records));
    setLoading(false);
  };

  const formatMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}時間${m > 0 ? ` ${m}分` : ''}`;
    return `${m}分`;
  };

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: '今日' },
    { key: 'week', label: '今週' },
    { key: 'month', label: '今月' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.periodRow}>
        {periods.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodChip, period === p.key && styles.periodChipActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text
              style={[
                styles.periodText,
                period === p.key && styles.periodTextActive,
              ]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : !summary ? (
        <Card>
          <Text style={styles.emptyText}>データがありません</Text>
        </Card>
      ) : (
        <>
          <Card>
            <Text style={styles.sectionTitle}>合計勉強時間</Text>
            <Text style={styles.totalTime}>
              {formatMinutes(summary.totalMinutes)}
            </Text>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>科目別</Text>
            {Object.keys(summary.bySubject).length === 0 ? (
              <Text style={styles.emptyText}>まだ記録がありません</Text>
            ) : (
              Object.entries(summary.bySubject)
                .sort(([, a], [, b]) => b - a)
                .map(([subject, minutes]) => {
                  const ratio =
                    summary.totalMinutes > 0
                      ? minutes / summary.totalMinutes
                      : 0;
                  return (
                    <View key={subject} style={styles.subjectRow}>
                      <View style={styles.subjectInfo}>
                        <Text style={styles.subjectName}>{subject}</Text>
                        <Text style={styles.subjectTime}>
                          {formatMinutes(minutes)}
                        </Text>
                      </View>
                      <View style={styles.barContainer}>
                        <View
                          style={[
                            styles.bar,
                            { width: `${ratio * 100}%` },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })
            )}
          </Card>
        </>
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
    paddingVertical: 40,
    alignItems: 'center',
  },
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  periodChipActive: {
    backgroundColor: '#3498db',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  periodTextActive: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
  },
  totalTime: {
    fontSize: 36,
    fontWeight: '800',
    color: '#3498db',
    textAlign: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    paddingVertical: 16,
  },
  subjectRow: {
    marginBottom: 12,
  },
  subjectInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  subjectTime: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  barContainer: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
});
