import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { DatePicker, TimePicker } from '../ui/DateTimePicker';
import { TypeSelector } from './TypeSelector';
import { toast } from '../ui/Toast';
import { EventType, CalendarEventInput } from '../../types';
import { EVENT_COLORS } from '../../utils/constants';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (calendarId: string, event: CalendarEventInput) => Promise<void>;
  calendarId: string;
  uid: string;
  initialDate?: string;
}

export function QuickEventSheet({
  visible,
  onClose,
  onSubmit,
  calendarId,
  uid,
  initialDate = '',
}: Props) {
  const getNowTime = () => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
  };
  const getEndTimeDefault = () => {
    const n = new Date();
    return `${String(Math.min(n.getHours() + 1, 23)).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
  };

  const [type, setType] = useState<EventType>('event');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(getNowTime);
  const [endTime, setEndTime] = useState(getEndTimeDefault);
  const [loading, setLoading] = useState(false);

  const resetForm = useCallback(() => {
    setTitle('');
    setDate(initialDate);
    setStartTime(getNowTime());
    setEndTime(getEndTimeDefault());
    setType('event');
    setLoading(false);
  }, [initialDate]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !date || !startTime || !endTime) {
      toast.error('必須項目を入力してください');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(calendarId, {
        title: title.trim(),
        type,
        date,
        startTime,
        endTime,
        color: EVENT_COLORS[type],
        createdBy: uid,
      });
      toast.success('予定を追加しました');
      handleClose();
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [title, date, startTime, endTime, type, calendarId, uid, onSubmit, handleClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} hitSlop={8}>
            <Ionicons name="close" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>予定を追加</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <TypeSelector selected={type} onSelect={setType} />

          <Text style={styles.label}>タイトル</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="タイトル"
            placeholderTextColor="#bdc3c7"
            autoFocus
          />

          <Text style={styles.label}>日付</Text>
          <DatePicker value={date} onChange={setDate} placeholder="日付を選択" />

          <Text style={styles.label}>時間</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeHalf}>
              <TimePicker value={startTime} onChange={setStartTime} placeholder="開始" />
            </View>
            <Text style={styles.timeDash}>→</Text>
            <View style={styles.timeHalf}>
              <TimePicker value={endTime} onChange={setEndTime} placeholder="終了" />
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="追加"
              onPress={handleSubmit}
              loading={loading}
              disabled={!title.trim() || !date || !startTime || !endTime}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2c3e50',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    gap: 12,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#2c3e50',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeHalf: {
    flex: 1,
  },
  timeDash: {
    fontSize: 16,
    color: '#95a5a6',
    fontWeight: '600',
  },
  actions: {
    marginTop: 16,
  },
});
