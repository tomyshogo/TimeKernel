import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
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

export default function PomodoroScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.uid);

  const settings = DEFAULT_POMODORO_SETTINGS;
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
    if (!selectedSubject) {
      toast.error('勉強する科目を選択してください');
      return;
    }
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* タイマー表示 */}
      <View style={[styles.timerContainer, { borderColor: PHASE_COLORS[phase] }]}>
        <Text style={[styles.phaseLabel, { color: PHASE_COLORS[phase] }]}>
          {PHASE_LABELS[phase]}
        </Text>
        <Text style={styles.timer}>{formatTime(secondsLeft)}</Text>
        <Text style={styles.cycleLabel}>
          サイクル {cycle} / {settings.cyclesBeforeLongBreak}
        </Text>

        {/* プログレスバー */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: PHASE_COLORS[phase],
              },
            ]}
          />
        </View>
      </View>

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
    paddingVertical: 40,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 3,
  },
  phaseLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  timer: {
    fontSize: 64,
    fontWeight: '800',
    color: '#2c3e50',
    fontVariant: ['tabular-nums'],
  },
  cycleLabel: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 8,
  },
  progressBar: {
    width: '80%',
    height: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
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
});
