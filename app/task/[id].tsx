import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { updateTask, deleteTask, getAllTasks } from '../../src/services/taskService';
import {
  Task,
  TaskType,
  TaskStatus,
  TASK_TYPE_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
} from '../../src/types';
import { Timestamp } from 'firebase/firestore';

export default function EditTaskScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const uid = useAuthStore((s) => s.uid);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>('assignment');
  const [description, setDescription] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [status, setStatus] = useState<TaskStatus>('todo');

  useEffect(() => {
    if (!uid || !id) return;
    getAllTasks(uid).then((tasks) => {
      const found = tasks.find((t) => t.id === id);
      if (found) {
        setTask(found);
        setTitle(found.title);
        setType(found.type);
        setDescription(found.description);
        setStatus(found.status);
        const d = found.deadline?.toDate?.() || new Date(found.deadline as any);
        setDeadlineDate(d.toISOString().split('T')[0]);
        setDeadlineTime(
          `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        );
      }
      setLoading(false);
    });
  }, [uid, id]);

  const handleSave = async () => {
    if (!uid || !id || !title.trim() || !deadlineDate) return;
    const deadline = Timestamp.fromDate(
      new Date(`${deadlineDate}T${deadlineTime}:00`)
    );
    await updateTask(uid, id, {
      title: title.trim(),
      type,
      description: description.trim(),
      deadline,
      status,
    });
    Alert.alert('保存しました');
    router.back();
  };

  const handleDelete = async () => {
    if (!uid || !id) return;
    Alert.alert('削除確認', 'この課題を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await deleteTask(uid, id);
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.center}>
        <Text>課題が見つかりません</Text>
      </View>
    );
  }

  const taskTypes: TaskType[] = ['assignment', 'exam', 'report'];
  const statuses: TaskStatus[] = ['todo', 'in_progress', 'done'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.sectionTitle}>課題を編集</Text>

        <Text style={styles.label}>タイトル</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>種類</Text>
        <View style={styles.chipRow}>
          {taskTypes.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, type === t && styles.chipActive]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.chipText, type === t && styles.chipTextActive]}>
                {TASK_TYPE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>ステータス</Text>
        <View style={styles.chipRow}>
          {statuses.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.chip,
                { borderColor: TASK_STATUS_COLORS[s] },
                status === s && { backgroundColor: TASK_STATUS_COLORS[s] },
              ]}
              onPress={() => setStatus(s)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: status === s ? '#fff' : TASK_STATUS_COLORS[s] },
                ]}
              >
                {TASK_STATUS_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>メモ</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>締切</Text>
        <Text style={styles.label}>日付 (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={deadlineDate}
          onChangeText={setDeadlineDate}
        />
        <Text style={styles.label}>時刻</Text>
        <TextInput
          style={styles.input}
          value={deadlineTime}
          onChangeText={setDeadlineTime}
        />
      </Card>

      <Card>
        <Text style={styles.metaLabel}>科目: {task.subject}</Text>
      </Card>

      <View style={styles.buttons}>
        <Button title="保存" onPress={handleSave} />
        <Button
          title="削除"
          variant="secondary"
          onPress={handleDelete}
          style={{ marginTop: 8 }}
        />
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3498db',
  },
  chipActive: {
    backgroundColor: '#3498db',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3498db',
  },
  chipTextActive: {
    color: '#fff',
  },
  metaLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  buttons: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
});
