import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { EventType, CalendarEventInput, Calendar, RecurrenceRule } from '../../types';
import { TypeSelector } from './TypeSelector';
import { RecurrenceSelector } from './RecurrenceSelector';
import { ColorPicker } from '../ui/ColorPicker';
import { Button } from '../ui/Button';
import { EVENT_COLORS } from '../../utils/constants';

interface Props {
  initialValues?: Partial<CalendarEventInput>;
  calendars: Calendar[];
  selectedCalendarId: string;
  onSubmit: (calendarId: string, event: CalendarEventInput) => void;
  onDelete?: () => void;
  isEdit?: boolean;
  uid: string;
}

export function EventForm({
  initialValues,
  calendars,
  selectedCalendarId,
  onSubmit,
  onDelete,
  isEdit = false,
  uid,
}: Props) {
  const [type, setType] = useState<EventType>(initialValues?.type || 'event');
  const [title, setTitle] = useState(initialValues?.title || '');
  const [date, setDate] = useState(initialValues?.date || '');
  const [startTime, setStartTime] = useState(initialValues?.startTime || '');
  const [endTime, setEndTime] = useState(initialValues?.endTime || '');
  const [hourlyWage, setHourlyWage] = useState(
    initialValues?.hourlyWage?.toString() || ''
  );
  const [color, setColor] = useState(
    initialValues?.color || EVENT_COLORS[type]
  );
  const [recurrence, setRecurrence] = useState<RecurrenceRule | undefined>(
    initialValues?.recurrence
  );
  const [calendarId, setCalendarId] = useState(selectedCalendarId);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !date || !startTime || !endTime) {
      Alert.alert('エラー', '必須項目を入力してください');
      return;
    }

    setLoading(true);
    try {
      const event: CalendarEventInput = {
        title: title.trim(),
        type,
        date,
        startTime,
        endTime,
        color,
        createdBy: uid,
        ...(type === 'shift' && hourlyWage
          ? { hourlyWage: parseInt(hourlyWage, 10) }
          : {}),
        ...(recurrence ? { recurrence } : {}),
      };
      onSubmit(calendarId, event);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>タイプ</Text>
      <TypeSelector
        selected={type}
        onSelect={(t) => {
          setType(t);
          setColor(EVENT_COLORS[t]);
        }}
      />

      <Text style={styles.label}>タイトル</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="予定のタイトル"
      />

      <Text style={styles.label}>日付 (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="2026-03-15"
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>開始時刻</Text>
          <TextInput
            style={styles.input}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="09:00"
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>終了時刻</Text>
          <TextInput
            style={styles.input}
            value={endTime}
            onChangeText={setEndTime}
            placeholder="10:30"
          />
        </View>
      </View>

      {type === 'shift' && (
        <>
          <Text style={styles.label}>時給 (円)</Text>
          <TextInput
            style={styles.input}
            value={hourlyWage}
            onChangeText={setHourlyWage}
            placeholder="1200"
            keyboardType="numeric"
          />
        </>
      )}

      <Text style={styles.label}>繰り返し</Text>
      <RecurrenceSelector value={recurrence} onChange={setRecurrence} />

      {calendars.length > 1 && (
        <>
          <Text style={styles.label}>カレンダー</Text>
          <View style={styles.calendarList}>
            {calendars.map((cal) => (
              <Button
                key={cal.id}
                title={cal.name}
                variant={calendarId === cal.id ? 'primary' : 'secondary'}
                onPress={() => setCalendarId(cal.id)}
                style={styles.calendarButton}
              />
            ))}
          </View>
        </>
      )}

      <Text style={styles.label}>カラー</Text>
      <ColorPicker selectedColor={color} onSelect={setColor} />

      <View style={styles.actions}>
        <Button
          title={isEdit ? '更新' : '追加'}
          onPress={handleSubmit}
          loading={loading}
        />
        {isEdit && onDelete && (
          <Button
            title="削除"
            variant="danger"
            onPress={() => {
              Alert.alert('確認', 'この予定を削除しますか？', [
                { text: 'キャンセル' },
                { text: '削除', style: 'destructive', onPress: onDelete },
              ]);
            }}
            style={{ marginTop: 8 }}
          />
        )}
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
    padding: 16,
    paddingBottom: 40,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  calendarList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actions: {
    marginTop: 24,
  },
});
