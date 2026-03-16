import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { createPoll } from '../../src/services/pollService';
import { PollCandidate } from '../../src/types';
import { Timestamp } from 'firebase/firestore';

export default function NewPollScreen() {
  const router = useRouter();
  const { calendarId } = useLocalSearchParams<{ calendarId: string }>();
  const uid = useAuthStore((s) => s.uid);
  const [title, setTitle] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [candidates, setCandidates] = useState<PollCandidate[]>([]);
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  const handleAddCandidate = () => {
    if (!newDate || !newStartTime || !newEndTime) {
      Alert.alert('入力エラー', '日付と時間を入力してください');
      return;
    }
    setCandidates((prev) => [
      ...prev,
      { date: newDate, startTime: newStartTime, endTime: newEndTime },
    ]);
    setNewDate('');
    setNewStartTime('');
    setNewEndTime('');
  };

  const removeCandidate = (index: number) => {
    setCandidates((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!uid || !calendarId || !title.trim() || candidates.length === 0) {
      Alert.alert('入力エラー', 'タイトルと候補日時を設定してください');
      return;
    }
    const deadline = deadlineDate
      ? Timestamp.fromDate(new Date(`${deadlineDate}T23:59:00`))
      : Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    await createPoll(calendarId, {
      title: title.trim(),
      createdBy: uid,
      deadline,
      status: 'open',
      confirmedSlot: null,
      candidates,
    });

    Alert.alert('投票を作成しました');
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.sectionTitle}>投票を作成</Text>
        <Text style={styles.label}>イベント名</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="ゼミ打ち上げ"
        />
        <Text style={styles.label}>投票締切 (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={deadlineDate}
          onChangeText={setDeadlineDate}
          placeholder="未設定なら1週間後"
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>候補日時を追加</Text>
        <Text style={styles.label}>日付</Text>
        <TextInput
          style={styles.input}
          value={newDate}
          onChangeText={setNewDate}
          placeholder="2026-04-10"
        />
        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <Text style={styles.label}>開始</Text>
            <TextInput
              style={styles.input}
              value={newStartTime}
              onChangeText={setNewStartTime}
              placeholder="18:00"
            />
          </View>
          <View style={styles.timeField}>
            <Text style={styles.label}>終了</Text>
            <TextInput
              style={styles.input}
              value={newEndTime}
              onChangeText={setNewEndTime}
              placeholder="21:00"
            />
          </View>
        </View>
        <Button title="候補を追加" variant="secondary" onPress={handleAddCandidate} />
      </Card>

      {candidates.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>候補一覧</Text>
          {candidates.map((c, i) => (
            <View key={i} style={styles.candidateRow}>
              <Text style={styles.candidateText}>
                {c.date} {c.startTime}〜{c.endTime}
              </Text>
              <TouchableOpacity onPress={() => removeCandidate(i)}>
                <Text style={styles.removeText}>削除</Text>
              </TouchableOpacity>
            </View>
          ))}
        </Card>
      )}

      <View style={styles.submit}>
        <Button title="投票を作成" onPress={handleSubmit} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingVertical: 8, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#2c3e50', marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeRow: { flexDirection: 'row', gap: 12 },
  timeField: { flex: 1 },
  candidateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  candidateText: { fontSize: 14, color: '#2c3e50' },
  removeText: { fontSize: 13, color: '#e74c3c', fontWeight: '600' },
  submit: { paddingHorizontal: 16, marginTop: 8 },
});
