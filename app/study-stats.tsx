import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '../src/components/ui/Card';
import { useAuthStore } from '../src/stores/authStore';
import {
  getStudyRecords,
  summarizeStudyRecords,
  StudySummary,
} from '../src/services/studyService';

type Period = 'today' | 'week' | 'month';

const CHART_WIDTH = Dimensions.get('window').width - 64;
const CHART_HEIGHT = 160;
const CHART_PADDING = { top: 20, right: 16, bottom: 28, left: 50 };

function StudyChart({ byDate, period }: { byDate: Record<string, number>; period: Period }) {
  const data = useMemo(() => {
    const now = new Date();
    const days: { date: string; label: string; minutes: number }[] = [];

    if (period === 'month') {
      // 今月の1日〜末日
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isWeekMark = day === 1 || (day % 7 === 1 && day + 6 < daysInMonth);
        const label = isWeekMark || day === daysInMonth ? `${month + 1}/${day}` : '';
        days.push({ date: dateStr, label, minutes: byDate[dateStr] || 0 });
      }
    } else {
      const numDays = period === 'today' ? 1 : 7;
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split('T')[0];
        days.push({
          date: dateStr,
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          minutes: byDate[dateStr] || 0,
        });
      }
    }
    return days;
  }, [byDate, period]);

  if (data.length <= 1) return null;

  const maxMinutes = Math.max(...data.map((d) => d.minutes), 1);
  const plotW = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const plotH = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  // Y軸のグリッド線（均等4分割、きれいな数値に丸める）
  const tickCount = 4;
  const rawStep = maxMinutes / tickCount;
  const step = Math.max(rawStep <= 10 ? Math.ceil(rawStep / 5) * 5 : Math.ceil(rawStep / 10) * 10, 5);
  const adjustedMax = step * tickCount;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => i * step);

  const points = data.map((d, i) => ({
    x: CHART_PADDING.left + (i / Math.max(data.length - 1, 1)) * plotW,
    y: CHART_PADDING.top + plotH - (d.minutes / adjustedMax) * plotH,
    ...d,
  }));

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View style={styles.chartContainer}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* グリッド線 */}
        {yTicks.map((tick) => {
          const y = CHART_PADDING.top + plotH - (tick / adjustedMax) * plotH;
          return (
            <React.Fragment key={tick}>
              <Line
                x1={CHART_PADDING.left}
                y1={y}
                x2={CHART_WIDTH - CHART_PADDING.right}
                y2={y}
                stroke="#f0f2f5"
                strokeWidth={1}
              />
              <SvgText
                x={CHART_PADDING.left - 10}
                y={y - 6}
                fill="#95a5a6"
                fontSize={9}
                textAnchor="end"
                letterSpacing={2}
              >
                {String(tick).padStart(3, ' ')}分
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* 折れ線 */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke="#3498db"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* データポイント */}
        {points.map((p, i) => (
          <React.Fragment key={i}>
            {p.minutes > 0 && (
              <Circle
                cx={p.x}
                cy={p.y}
                r={3.5}
                fill="#3498db"
                stroke="#fff"
                strokeWidth={2}
              />
            )}
            {p.label !== '' && (
              <SvgText
                x={p.x}
                y={CHART_HEIGHT - 4}
                fill="#95a5a6"
                fontSize={9}
                textAnchor="middle"
              >
                {p.label}
              </SvgText>
            )}
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

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
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      }
    }

    try {
      const records = await getStudyRecords(uid, startDate, endDate);
      setSummary(summarizeStudyRecords(records));
    } catch {
      Alert.alert('エラー', '勉強記録の取得に失敗しました');
    } finally {
      setLoading(false);
    }
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

  const avgMinutes = useMemo(() => {
    if (!summary || period === 'today') return null;
    const now = new Date();
    const divisor = period === 'week' ? 7 : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Math.round(summary.totalMinutes / divisor);
  }, [summary, period]);

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
          {/* 合計・平均 */}
          <Animated.View entering={FadeInDown.duration(300).springify()}>
            <Card>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>合計</Text>
                  <Text style={styles.totalTime}>
                    {formatMinutes(summary.totalMinutes)}
                  </Text>
                </View>
                {avgMinutes !== null && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>1日平均</Text>
                    <Text style={styles.avgTime}>
                      {formatMinutes(avgMinutes)}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          </Animated.View>

          {/* 折れ線グラフ */}
          {period !== 'today' && (
            <Animated.View entering={FadeInDown.delay(60).duration(300).springify()}>
              <Card>
                <Text style={styles.sectionTitle}>日別の勉強時間</Text>
                <StudyChart byDate={summary.byDate} period={period} />
              </Card>
            </Animated.View>
          )}

          {/* 科目別 */}
          <Animated.View entering={FadeInDown.delay(120).duration(300).springify()}>
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
          </Animated.View>
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#95a5a6',
    fontWeight: '600',
    marginBottom: 4,
  },
  totalTime: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3498db',
  },
  avgTime: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2ecc71',
  },
  chartContainer: {
    alignItems: 'center',
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
