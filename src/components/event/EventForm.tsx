import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { EventType, CalendarEventInput, Calendar, RecurrenceRule } from '../../types';
import { TypeSelector } from './TypeSelector';
import { RecurrenceSelector } from './RecurrenceSelector';
import { ColorPicker } from '../ui/ColorPicker';
import { Button } from '../ui/Button';
import { DatePicker, TimePicker } from '../ui/DateTimePicker';
import { toast } from '../ui/Toast';
import { EVENT_COLORS } from '../../utils/constants';

interface Props {
  initialValues?: Partial<CalendarEventInput>;
  calendars: Calendar[];
  selectedCalendarId: string;
  onSubmit: (calendarId: string, event: CalendarEventInput) => void | Promise<void>;
  onDelete?: () => void;
  isEdit?: boolean;
  uid: string;
  fixedType?: boolean;
}

export function EventForm({
  initialValues,
  calendars,
  selectedCalendarId,
  onSubmit,
  onDelete,
  isEdit = false,
  uid,
  fixedType = false,
}: Props) {
  const [type, setType] = useState<EventType>(initialValues?.type || 'event');
  const [title, setTitle] = useState(initialValues?.title || '');
  const [date, setDate] = useState(initialValues?.date || '');
  const [endDate, setEndDate] = useState(initialValues?.endDate || '');
  const [isAllDay, setIsAllDay] = useState(initialValues?.isAllDay || false);
  const nowForDefault = new Date();
  const defaultStartTime = `${String(nowForDefault.getHours()).padStart(2, '0')}:${String(nowForDefault.getMinutes()).padStart(2, '0')}`;
  const defaultEndTime = `${String(Math.min(nowForDefault.getHours() + 1, 23)).padStart(2, '0')}:${String(nowForDefault.getMinutes()).padStart(2, '0')}`;
  const [startTime, setStartTime] = useState(initialValues?.startTime || defaultStartTime);
  const [endTime, setEndTime] = useState(initialValues?.endTime || defaultEndTime);
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
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleAllDayToggle = (value: boolean) => {
    setIsAllDay(value);
    if (value) {
      setStartTime('');
      setEndTime('');
    }
  };

  const isValid = () => {
    if (!title.trim() || !date) return false;
    if (isAllDay) return true;
    if (!startTime || !endTime) return false;
    if (!endDate && startTime >= endTime) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!isValid()) {
      toast.error('必須項目を入力してください');
      return;
    }

    setLoading(true);
    try {
      const event: CalendarEventInput = {
        title: title.trim(),
        type,
        date,
        startTime: isAllDay ? '' : startTime,
        endTime: isAllDay ? '' : endTime,
        color,
        createdBy: uid,
        ...(isAllDay ? { isAllDay: true } : {}),
        ...(endDate && endDate !== date ? { endDate } : {}),
        ...(type === 'shift' && hourlyWage
          ? { hourlyWage: parseInt(hourlyWage, 10) }
          : {}),
        ...(recurrence ? { recurrence } : {}),
      };
      await onSubmit(calendarId, event);
    } catch {
      toast.error('保存に失敗しました。もう一度お試しください');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {!fixedType && (
        <>
          <Text style={styles.label}>タイプ</Text>
          <TypeSelector
            selected={type}
            onSelect={(t) => {
              setType(t);
              setColor(EVENT_COLORS[t]);
            }}
          />
        </>
      )}

      <Text style={styles.label}>タイトル <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={[
          styles.input,
          touched.title && !title.trim() && styles.inputError,
        ]}
        value={title}
        onChangeText={setTitle}
        onBlur={() => setTouched((t) => ({ ...t, title: true }))}
        placeholder="予定のタイトル"
      />
      {touched.title && !title.trim() && (
        <Text style={styles.errorText}>タイトルを入力してください</Text>
      )}

      <View style={styles.allDayRow}>
        <Text style={styles.label}>終日</Text>
        <Switch
          value={isAllDay}
          onValueChange={handleAllDayToggle}
          trackColor={{ false: '#e0e0e0', true: '#3498db' }}
        />
      </View>

      <Text style={styles.label}>開始日 <Text style={styles.required}>*</Text></Text>
      <DatePicker value={date} onChange={setDate} placeholder="開始日を選択" />

      {isAllDay && (
        <>
          <Text style={styles.label}>終了日</Text>
          <DatePicker value={endDate} onChange={setEndDate} placeholder="終了日を選択（任意）" />
          {endDate && date && endDate < date && (
            <Text style={styles.errorText}>終了日は開始日以降にしてください</Text>
          )}
        </>
      )}

      {!isAllDay && (
        <>
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>開始時刻 <Text style={styles.required}>*</Text></Text>
              <TimePicker value={startTime} onChange={setStartTime} placeholder="開始" />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>終了時刻 <Text style={styles.required}>*</Text></Text>
              <TimePicker value={endTime} onChange={setEndTime} placeholder="終了" />
            </View>
          </View>
          {!endDate && startTime && endTime && startTime >= endTime && (
            <Text style={styles.errorText}>終了時刻は開始時刻より後にしてください</Text>
          )}

          <Text style={styles.label}>終了日</Text>
          <DatePicker value={endDate} onChange={setEndDate} placeholder="複数日の場合に選択" />
          {endDate && date && endDate < date && (
            <Text style={styles.errorText}>終了日は開始日以降にしてください</Text>
          )}
        </>
      )}

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
          disabled={!isValid()}
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
    </KeyboardAvoidingView>
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
  allDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 0,
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
  required: {
    color: '#e74c3c',
    fontSize: 14,
  },
  inputError: {
    borderColor: '#e74c3c',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
});
