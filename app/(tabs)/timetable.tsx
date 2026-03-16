import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { TimetableGrid } from '../../src/components/timetable/TimetableGrid';
import { ColorPicker } from '../../src/components/ui/ColorPicker';
import { Button } from '../../src/components/ui/Button';
import { useTimetables } from '../../src/hooks/useTimetables';
import { useAuthStore } from '../../src/stores/authStore';
import {
  createTimetable,
  updateSlot,
} from '../../src/services/timetableService';
import { DayOfWeek, TimetableSlot } from '../../src/types';

export default function TimetableScreen() {
  const uid = useAuthStore((s) => s.uid);
  const periods = useAuthStore((s) => s.settings.periods);
  const { timetables, isLoading } = useTimetables();
  const [editingSlot, setEditingSlot] = useState<{
    timetableId: string;
    key: string;
    slot: TimetableSlot;
  } | null>(null);
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');
  const [color, setColor] = useState('#3498db');

  const handleCreateTimetable = async () => {
    if (!uid) return;
    await createTimetable(uid, {
      calendarId: null,
      isPublic: false,
      slots: {},
    });
  };

  const handleSlotPress = (
    timetableId: string,
    dayOfWeek: DayOfWeek,
    period: number
  ) => {
    const tt = timetables.find((t) => t.id === timetableId);
    if (!tt) return;
    const key = `${dayOfWeek}_${period}`;
    const existing = tt.slots[key];
    if (existing) {
      setSubject(existing.subject);
      setRoom(existing.room);
      setColor(existing.color);
    } else {
      setSubject('');
      setRoom('');
      setColor('#3498db');
    }
    setEditingSlot({ timetableId, key, slot: existing || { subject: '', room: '', color: '#3498db' } });
  };

  const handleSaveSlot = async () => {
    if (!uid || !editingSlot) return;
    if (!subject.trim()) {
      await updateSlot(uid, editingSlot.timetableId, editingSlot.key, null);
    } else {
      await updateSlot(uid, editingSlot.timetableId, editingSlot.key, {
        subject: subject.trim(),
        room: room.trim(),
        color,
      });
    }
    setEditingSlot(null);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>読み込み中...</Text>
      </View>
    );
  }

  if (editingSlot) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.editContent}>
        <Text style={styles.editTitle}>科目を編集</Text>
        <Text style={styles.label}>科目名</Text>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="経済学入門"
        />
        <Text style={styles.label}>教室</Text>
        <TextInput
          style={styles.input}
          value={room}
          onChangeText={setRoom}
          placeholder="A棟301"
        />
        <Text style={styles.label}>カラー</Text>
        <ColorPicker selectedColor={color} onSelect={setColor} />
        <View style={styles.editActions}>
          <Button title="保存" onPress={handleSaveSlot} />
          <Button
            title="キャンセル"
            variant="secondary"
            onPress={() => setEditingSlot(null)}
            style={{ marginTop: 8 }}
          />
          {subject.trim() && (
            <Button
              title="この科目を削除"
              variant="danger"
              onPress={() => {
                Alert.alert('確認', 'この科目を削除しますか？', [
                  { text: 'キャンセル' },
                  {
                    text: '削除',
                    style: 'destructive',
                    onPress: async () => {
                      if (!uid) return;
                      await updateSlot(uid, editingSlot.timetableId, editingSlot.key, null);
                      setEditingSlot(null);
                    },
                  },
                ]);
              }}
              style={{ marginTop: 8 }}
            />
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {timetables.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>時間割がありません</Text>
          <Button
            title="時間割を作成"
            onPress={handleCreateTimetable}
            style={{ marginTop: 16 }}
          />
        </View>
      ) : (
        timetables.map((tt) => (
          <View key={tt.id} style={styles.timetableSection}>
            <TimetableGrid
              periods={periods}
              slots={tt.slots}
              onSlotPress={(day, period) =>
                handleSlotPress(tt.id, day, period)
              }
            />
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
  },
  timetableSection: {
    flex: 1,
    padding: 8,
  },
  editContent: {
    padding: 16,
    paddingBottom: 40,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  editActions: {
    marginTop: 24,
  },
});
