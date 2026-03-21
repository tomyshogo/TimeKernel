import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { DatePicker, TimePicker } from '../../src/components/ui/DateTimePicker';
import { useAuthStore } from '../../src/stores/authStore';
import { addTask } from '../../src/services/taskService';
import { getAllTimetables } from '../../src/services/timetableService';
import { scheduleEventReminder } from '../../src/services/notificationService';
import {
  TaskType,
  TASK_TYPE_LABELS,
  DEFAULT_REMINDER_MINUTES,
  Timetable,
} from '../../src/types';
import { Timestamp } from 'firebase/firestore';

export default function NewTaskScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.uid);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>('assignment');
  const [description, setDescription] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState('');
  const [selectedSlotKey, setSelectedSlotKey] = useState('');

  useEffect(() => {
    if (!uid) return;
    getAllTimetables(uid).then((tt) => {
      setTimetables(tt);
      if (tt.length > 0) setSelectedTimetableId(tt[0].id);
    });
  }, [uid]);

  const selectedTimetable = timetables.find((t) => t.id === selectedTimetableId);
  const slots = selectedTimetable?.slots || {};
  const uniqueSubjects = [...new Set(Object.entries(slots).map(([, s]) => s.subject))];

  const handleSubmit = async () => {
    if (!uid || !title.trim() || !deadlineDate) {
      Alert.alert('入力エラー', 'タイトルと締切日を入力してください');
      return;
    }

    const slotEntry = Object.entries(slots).find(
      ([key]) => key === selectedSlotKey
    );
    const subject = slotEntry ? slotEntry[1].subject : '(未設定)';

    const deadline = Timestamp.fromDate(
      new Date(`${deadlineDate}T${deadlineTime}:00`)
    );

    try {
      await addTask(uid, {
        title: title.trim(),
        type,
        description: description.trim(),
        deadline,
        status: 'todo',
        reminderMinutes: DEFAULT_REMINDER_MINUTES,
        subject,
        slotKey: selectedSlotKey,
        timetableId: selectedTimetableId,
      });

      Alert.alert('追加しました');
      router.back();
    } catch {
      Alert.alert('エラー', '課題の追加に失敗しました。もう一度お試しください。');
    }
  };

  const taskTypes: TaskType[] = ['assignment', 'exam', 'report'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.sectionTitle}>課題を追加</Text>

        <Text style={styles.label}>タイトル</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="レポート提出"
        />

        <Text style={styles.label}>種類</Text>
        <View style={styles.typeRow}>
          {taskTypes.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeChip, type === t && styles.typeChipActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeText, type === t && styles.typeTextActive]}>
                {TASK_TYPE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>メモ</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="詳細を入力"
          multiline
          numberOfLines={3}
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>締切</Text>
        <Text style={styles.label}>日付</Text>
        <DatePicker value={deadlineDate} onChange={setDeadlineDate} placeholder="日付を選択" />
        <Text style={styles.label}>時刻</Text>
        <TimePicker value={deadlineTime} onChange={setDeadlineTime} placeholder="時刻を選択" />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>科目紐づけ</Text>
        {timetables.length === 0 ? (
          <Text style={styles.emptyText}>時間割がありません</Text>
        ) : (
          <>
            <Text style={styles.label}>科目を選択</Text>
            <View style={styles.typeRow}>
              {Object.entries(slots).map(([key, slot]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.subjectChip,
                    { borderColor: slot.color },
                    selectedSlotKey === key && { backgroundColor: slot.color },
                  ]}
                  onPress={() => setSelectedSlotKey(key)}
                >
                  <Text
                    style={[
                      styles.subjectText,
                      { color: selectedSlotKey === key ? '#fff' : slot.color },
                    ]}
                  >
                    {slot.subject}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </Card>

      <View style={styles.submitButton}>
        <Button title="課題を追加" onPress={handleSubmit} />
      </View>
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
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  typeChipActive: {
    backgroundColor: '#3498db',
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  typeTextActive: {
    color: '#fff',
  },
  subjectChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
  },
  subjectText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    paddingVertical: 16,
  },
  submitButton: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
});
