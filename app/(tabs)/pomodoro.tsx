import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { getAllTimetables } from '../../src/services/timetableService';
import { addStudyRecord } from '../../src/services/studyService';
import {
  Timetable,
  TimetableSlot,
  PomodoroPhase,
  DEFAULT_POMODORO_SETTINGS,
} from '../../src/types';
import { Timestamp } from 'firebase/firestore';
import { toast } from '../../src/components/ui/Toast';
import { useStreak } from '../../src/hooks/useStreak';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const TIMER_SIZE = Math.min(Dimensions.get('window').width - 64, 260);
const STROKE_WIDTH = 10;
const RADIUS = (TIMER_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const PHASE_COLORS: Record<PomodoroPhase, string> = {
  work: '#e74c3c',
  shortBreak: '#2ecc71',
  longBreak: '#3498db',
};

const PHASE_LABELS: Record<PomodoroPhase, string> = {
  work: '集中',
  shortBreak: '小休憩',
  longBreak: '大休憩',
};

const WORK_PRESETS = [15, 20, 25, 30, 45, 50, 60];

export default function PomodoroScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.uid);

  const [workMinutes, setWorkMinutes] = useState(DEFAULT_POMODORO_SETTINGS.workMinutes);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const settings = {
    ...DEFAULT_POMODORO_SETTINGS,
    workMinutes,
  };
  const streak = useStreak(uid);
  const [phase, setPhase] = useState<PomodoroPhase>('work');
  const [secondsLeft, setSecondsLeft] = useState(settings.workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cycle, setCycle] = useState(1);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSlotKey, setSelectedSlotKey] = useState('');
  const [selectedTimetableId, setSelectedTimetableId] = useState('');
  const startTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [totalStudyMinutes, setTotalStudyMinutes] = useState(0);

  useEffect(() => {
    if (!uid) return;
    getAllTimetables(uid).then((tt) => {
      setTimetables(tt);
      if (tt.length > 0) setSelectedTimetableId(tt[0].id);
    });
  }, [uid]);

  const selectedTimetable = timetables.find((t) => t.id === selectedTimetableId);
  const slots = selectedTimetable?.slots || {};
  const uniqueSlots = Object.entries(slots).reduce<
    { key: string; slot: TimetableSlot }[]
  >((acc, [key, slot]) => {
    if (!acc.find((s) => s.slot.subject === slot.subject)) {
      acc.push({ key, slot });
    }
    return acc;
  }, []);

  const getDuration = useCallback(
    (p: PomodoroPhase) => {
      switch (p) {
        case 'work':
          return settings.workMinutes * 60;
        case 'shortBreak':
          return settings.shortBreakMinutes * 60;
        case 'longBreak':
          return settings.longBreakMinutes * 60;
      }
    },
    [settings]
  );

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          handlePhaseComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, phase, cycle]);

  const handlePhaseComplete = async () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (phase === 'work') {
      // 勉強記録を保存
      if (uid && selectedSubject && startTimeRef.current) {
        try {
          await addStudyRecord(uid, {
            subject: selectedSubject,
            slotKey: selectedSlotKey,
            timetableId: selectedTimetableId,
            durationMinutes: settings.workMinutes,
            date: new Date().toISOString().split('T')[0],
            startedAt: Timestamp.fromDate(startTimeRef.current),
            completedAt: Timestamp.now(),
          });
        } catch {
          toast.error('勉強記録の保存に失敗しました');
        }
      }

      // 次のフェーズへ
      if (cycle >= settings.cyclesBeforeLongBreak) {
        setPhase('longBreak');
        setSecondsLeft(getDuration('longBreak'));
        setCycle(1);
      } else {
        setPhase('shortBreak');
        setSecondsLeft(getDuration('shortBreak'));
      }
      setCompletedCycles((c) => c + 1);
      setTotalStudyMinutes((m) => m + settings.workMinutes);
      toast.info('集中タイム終了！休憩しましょう');
    } else {
      // 休憩終了
      if (phase === 'shortBreak') {
        setCycle((c) => c + 1);
      }
      setPhase('work');
      setSecondsLeft(getDuration('work'));
      toast.info('休憩終了！集中タイムを始めましょう');
    }
  };

  const handleStart = () => {
    startTimeRef.current = new Date();
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setPhase('work');
    setSecondsLeft(getDuration('work'));
    setCycle(1);
    startTimeRef.current = null;
    setCompletedCycles(0);
    setTotalStudyMinutes(0);
  };

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const totalSeconds = getDuration(phase);
  const progress = 1 - secondsLeft / totalSeconds;

  // 円形プログレスアニメーション
  const animatedProgress = useSharedValue(0);
  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - animatedProgress.value),
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 円形タイマー */}
      <View style={styles.timerContainer}>
        <View style={styles.circularTimer}>
          <Svg width={TIMER_SIZE} height={TIMER_SIZE}>
            {/* 背景リング */}
            <Circle
              cx={TIMER_SIZE / 2}
              cy={TIMER_SIZE / 2}
              r={RADIUS}
              stroke="#ecf0f1"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* プログレスリング */}
            <AnimatedCircle
              cx={TIMER_SIZE / 2}
              cy={TIMER_SIZE / 2}
              r={RADIUS}
              stroke={PHASE_COLORS[phase]}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              animatedProps={animatedProps}
              strokeLinecap="round"
              rotation="-90"
              origin={`${TIMER_SIZE / 2}, ${TIMER_SIZE / 2}`}
            />
          </Svg>
          {/* 中央テキスト */}
          <View style={styles.timerTextOverlay}>
            <Text style={[styles.phaseLabel, { color: PHASE_COLORS[phase] }]}>
              {PHASE_LABELS[phase]}
            </Text>
            <Text style={styles.timer}>{formatTime(secondsLeft)}</Text>
            <Text style={styles.cycleLabel}>
              {cycle} / {settings.cyclesBeforeLongBreak}
            </Text>
          </View>
        </View>
        {/* 時間変更ボタン */}
        {!isRunning && phase === 'work' && !startTimeRef.current && (
          <TouchableOpacity
            style={styles.durationToggle}
            onPress={() => setShowDurationPicker(!showDurationPicker)}
          >
            <Text style={styles.durationToggleText}>
              {workMinutes}分 ▾
            </Text>
          </TouchableOpacity>
        )}
        {showDurationPicker && !isRunning && (
          <View style={styles.durationPicker}>
            {WORK_PRESETS.map((min) => (
              <TouchableOpacity
                key={min}
                style={[
                  styles.durationChip,
                  workMinutes === min && styles.durationChipActive,
                ]}
                onPress={() => {
                  setWorkMinutes(min);
                  setSecondsLeft(min * 60);
                  setShowDurationPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.durationChipText,
                    workMinutes === min && styles.durationChipTextActive,
                  ]}
                >
                  {min}分
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* ストリーク表示 */}
      {!streak.loading && (
        <View style={styles.streakContainer}>
          <View style={[styles.streakBadge, streak.todayCompleted && styles.streakBadgeActive]}>
            <Text style={styles.streakFire}>{streak.todayCompleted ? '🔥' : '💤'}</Text>
            <Text style={[styles.streakCount, streak.todayCompleted && styles.streakCountActive]}>
              {streak.currentStreak}
            </Text>
            <Text style={styles.streakLabel}>日連続</Text>
          </View>
          {streak.longestStreak > streak.currentStreak && (
            <Text style={styles.longestStreak}>
              最長: {streak.longestStreak}日
            </Text>
          )}
          {!streak.todayCompleted && streak.currentStreak > 0 && (
            <Text style={styles.streakWarning}>
              今日勉強してストリークを維持しよう！
            </Text>
          )}
        </View>
      )}

      {/* コントロール */}
      <View style={styles.controls}>
        {!isRunning ? (
          <Button title="開始" onPress={handleStart} />
        ) : (
          <Button title="一時停止" variant="secondary" onPress={handlePause} />
        )}
        <Button
          title="リセット"
          variant="secondary"
          onPress={handleReset}
          style={{ marginTop: 8 }}
        />
      </View>

      {/* 一時停止中の表示 */}
      {!isRunning && startTimeRef.current && secondsLeft > 0 && (
        <View style={styles.pauseBanner}>
          <Text style={styles.pauseText}>⏸ 一時停止中</Text>
        </View>
      )}

      {/* セッションサマリー */}
      {completedCycles > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>今回のセッション</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{completedCycles}</Text>
              <Text style={styles.summaryLabel}>完了サイクル</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalStudyMinutes}</Text>
              <Text style={styles.summaryLabel}>集中(分)</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{selectedSubject || '-'}</Text>
              <Text style={styles.summaryLabel}>科目</Text>
            </View>
          </View>
        </Card>
      )}

      {/* 科目選択 */}
      <Card>
        <Text style={styles.sectionTitle}>科目を選択</Text>
        {uniqueSlots.length === 0 ? (
          <Text style={styles.emptyText}>
            時間割に科目を登録してください
          </Text>
        ) : (
          <View style={styles.subjectGrid}>
            {uniqueSlots.map(({ key, slot }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.subjectChip,
                  { borderColor: slot.color },
                  selectedSlotKey === key && { backgroundColor: slot.color },
                ]}
                onPress={() => {
                  setSelectedSlotKey(key);
                  setSelectedSubject(slot.subject);
                }}
                disabled={isRunning}
              >
                <Text
                  style={[
                    styles.subjectText,
                    {
                      color: selectedSlotKey === key ? '#fff' : slot.color,
                    },
                  ]}
                >
                  {slot.subject}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>

      {/* 統計リンク */}
      <Card>
        <Button
          title="勉強統計を見る"
          variant="secondary"
          onPress={() => router.push('/study-stats')}
        />
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
  timerContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  circularTimer: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerTextOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  timer: {
    fontSize: 48,
    fontWeight: '800',
    color: '#2c3e50',
    fontVariant: ['tabular-nums'],
  },
  cycleLabel: {
    fontSize: 13,
    color: '#95a5a6',
    marginTop: 4,
  },
  streakContainer: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  streakBadgeActive: {
    backgroundColor: '#fff3e0',
    borderWidth: 1.5,
    borderColor: '#ff9800',
  },
  streakFire: {
    fontSize: 18,
  },
  streakCount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#95a5a6',
    fontVariant: ['tabular-nums'],
  },
  streakCountActive: {
    color: '#ff9800',
  },
  streakLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  longestStreak: {
    fontSize: 11,
    color: '#95a5a6',
    marginTop: 4,
  },
  streakWarning: {
    fontSize: 12,
    color: '#e67e22',
    fontWeight: '600',
    marginTop: 4,
  },
  controls: {
    paddingHorizontal: 16,
    marginVertical: 8,
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
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pauseBanner: {
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 16,
    backgroundColor: '#f39c12',
    borderRadius: 10,
    marginBottom: 4,
  },
  pauseText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2c3e50',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
  },
  durationToggle: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#f0f3f8',
    borderRadius: 14,
  },
  durationToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3498db',
  },
  durationPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  durationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f3f8',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  durationChipActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  durationChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  durationChipTextActive: {
    color: '#fff',
  },
});
