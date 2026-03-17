import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { CalendarEvent, Task } from '../../types';
import { formatDate } from '../../utils/dateHelpers';
import { subscribeToTasks } from '../../services/taskService';
import { getStudyRecords, summarizeStudyRecords } from '../../services/studyService';

interface Props {
  uid: string | null;
  events: CalendarEvent[];
  selectedDate: string;
}

interface SummaryData {
  todayEventCount: number;
  pendingTaskCount: number;
  overdueTaskCount: number;
  monthStudyMinutes: number;
  nextEvent: CalendarEvent | null;
}

function AnimatedNumber({ value, color }: { value: number; color: string }) {
  const animValue = useSharedValue(0);

  useEffect(() => {
    animValue.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [value]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: animValue.value,
    transform: [{ scale: 0.5 + animValue.value * 0.5 }],
  }));

  return (
    <Animated.Text style={[styles.metricValue, { color }, animStyle]}>
      {value}
    </Animated.Text>
  );
}

export function DashboardSummary({ uid, events, selectedDate }: Props) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [monthStudyMinutes, setMonthStudyMinutes] = useState(0);

  // タスク購読
  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeToTasks(uid, setTasks);
    return () => unsub();
  }, [uid]);

  // 今月の勉強時間
  useEffect(() => {
    if (!uid) return;
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const monthEnd = formatDate(now);
    getStudyRecords(uid, monthStart, monthEnd).then((records) => {
      const summary = summarizeStudyRecords(records);
      setMonthStudyMinutes(summary.totalMinutes);
    }).catch(() => {});
  }, [uid]);

  const summary = useMemo<SummaryData>(() => {
    const todayStr = formatDate(new Date());
    const todayEvents = events.filter((e) => e.date === todayStr && !e.id.startsWith('timetable_'));
    const now = new Date();

    const pendingTasks = tasks.filter((t) => t.status !== 'done');
    const overdueTasks = pendingTasks.filter((t) => {
      const d = t.deadline?.toDate?.() || new Date(t.deadline);
      return d.getTime() < now.getTime();
    });

    // 次の予定（今日の中でまだ始まっていないもの）
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const upcoming = todayEvents
      .filter((e) => e.startTime > nowTime)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return {
      todayEventCount: todayEvents.length,
      pendingTaskCount: pendingTasks.length,
      overdueTaskCount: overdueTasks.length,
      monthStudyMinutes,
      nextEvent: upcoming[0] || null,
    };
  }, [events, tasks, monthStudyMinutes]);

  // カード展開アニメーション
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(10);

  useEffect(() => {
    cardOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    cardTranslateY.value = withDelay(100, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, []);

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const studyHours = Math.floor(monthStudyMinutes / 60);
  const studyMins = monthStudyMinutes % 60;

  return (
    <Animated.View style={[styles.container, cardAnimStyle]}>
      {/* メトリクスカード群 */}
      <View style={styles.metricsRow}>
        <TouchableOpacity style={styles.metricCard} activeOpacity={0.7}>
          <AnimatedNumber value={summary.todayEventCount} color="#3498db" />
          <Text style={styles.metricLabel}>今日の予定</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.metricCard}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/tasks')}
        >
          <AnimatedNumber
            value={summary.pendingTaskCount}
            color={summary.overdueTaskCount > 0 ? '#e74c3c' : '#2ecc71'}
          />
          <Text style={styles.metricLabel}>残りタスク</Text>
          {summary.overdueTaskCount > 0 && (
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueBadgeText}>{summary.overdueTaskCount}件超過</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.metricCard}
          activeOpacity={0.7}
          onPress={() => router.push('/study-stats')}
        >
          <Text style={[styles.metricValue, { color: '#9b59b6' }]}>
            {studyHours > 0 ? `${studyHours}h` : `${studyMins}m`}
          </Text>
          <Text style={styles.metricLabel}>今月の勉強</Text>
        </TouchableOpacity>
      </View>

      {/* 次の予定バナー */}
      {summary.nextEvent && (
        <TouchableOpacity
          style={styles.nextEventBanner}
          activeOpacity={0.7}
          onPress={() => {
            const e = summary.nextEvent!;
            if (!e.id.startsWith('exam_')) {
              router.push(`/event/${e.id}?calendarId=${e.calendarId}`);
            }
          }}
        >
          <View style={[styles.nextEventDot, { backgroundColor: summary.nextEvent.color }]} />
          <View style={styles.nextEventInfo}>
            <Text style={styles.nextEventLabel}>次の予定</Text>
            <Text style={styles.nextEventTitle} numberOfLines={1}>
              {summary.nextEvent.title}
            </Text>
          </View>
          <Text style={styles.nextEventTime}>{summary.nextEvent.startTime}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#95a5a6',
    marginTop: 2,
  },
  overdueBadge: {
    backgroundColor: '#fdecea',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  overdueBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#e74c3c',
  },
  nextEventBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  nextEventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  nextEventInfo: {
    flex: 1,
  },
  nextEventLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#95a5a6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextEventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 1,
  },
  nextEventTime: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3498db',
    fontVariant: ['tabular-nums'],
  },
});
