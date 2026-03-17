import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
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
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['55%', '80%'], []);

  const [type, setType] = useState<EventType>('event');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = useCallback(() => {
    setTitle('');
    setDate(initialDate);
    setStartTime('');
    setEndTime('');
    setType('event');
    setLoading(false);
  }, [initialDate]);

  const handleClose = useCallback(() => {
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

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
      />
    ),
    []
  );

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.sheetTitle}>予定を追加</Text>

        <TypeSelector
          selected={type}
          onSelect={setType}
        />

        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="タイトル"
          placeholderTextColor="#bdc3c7"
          autoFocus
        />

        <DatePicker value={date} onChange={setDate} placeholder="日付を選択" />

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
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: '#d0d0d0',
    width: 40,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 4,
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
    marginTop: 8,
  },
});
