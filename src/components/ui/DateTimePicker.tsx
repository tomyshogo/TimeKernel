import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
}

interface TimePickerProps {
  value: string; // HH:MM
  onChange: (time: string) => void;
  placeholder?: string;
}

/** YYYY-MM-DD を選択できるカスタム日付ピッカー */
export function DatePicker({ value, onChange, placeholder = '日付を選択' }: DatePickerProps) {
  const [visible, setVisible] = useState(false);
  const today = new Date();
  const [viewYear, setViewYear] = useState(
    value ? parseInt(value.split('-')[0]) : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    value ? parseInt(value.split('-')[1]) - 1 : today.getMonth()
  );

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handleSelect = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setVisible(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const displayValue = value || placeholder;
  const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <>
      <TouchableOpacity
        style={[styles.input, !value && styles.inputPlaceholder]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {displayValue}
        </Text>
        <Text style={styles.inputIcon}>📅</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.pickerContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={prevMonth} style={styles.navButton}>
                <Text style={styles.navText}>◀</Text>
              </TouchableOpacity>
              <Text style={styles.monthLabel}>
                {viewYear}年{viewMonth + 1}月
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
                <Text style={styles.navText}>▶</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((d, i) => (
                <Text
                  key={d}
                  style={[
                    styles.weekdayLabel,
                    i === 0 && { color: '#e74c3c' },
                    i === 6 && { color: '#3498db' },
                  ]}
                >
                  {d}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.dayCell} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const m = String(viewMonth + 1).padStart(2, '0');
                const d = String(day).padStart(2, '0');
                const dateStr = `${viewYear}-${m}-${d}`;
                const isSelected = dateStr === value;
                const dayOfWeek = (firstDayOfWeek + i) % 7;

                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                    onPress={() => handleSelect(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        !isSelected && dayOfWeek === 0 && { color: '#e74c3c' },
                        !isSelected && dayOfWeek === 6 && { color: '#3498db' },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

/** HH:MM を選択できるカスタム時刻ピッカー */
export function TimePicker({ value, onChange, placeholder = '時刻を選択' }: TimePickerProps) {
  const [visible, setVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState(
    value ? parseInt(value.split(':')[0]) : 9
  );
  const [selectedMinute, setSelectedMinute] = useState(
    value ? parseInt(value.split(':')[1]) : 0
  );

  const handleConfirm = () => {
    const h = String(selectedHour).padStart(2, '0');
    const m = String(selectedMinute).padStart(2, '0');
    onChange(`${h}:${m}`);
    setVisible(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <>
      <TouchableOpacity
        style={[styles.input, !value && styles.inputPlaceholder]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Text style={styles.inputIcon}>🕐</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.timePickerContainer} onStartShouldSetResponder={() => true}>
            <Text style={styles.timePickerTitle}>時刻を選択</Text>
            <View style={styles.timeColumns}>
              <ScrollView style={styles.timeColumn} showsVerticalScrollIndicator={false}>
                {hours.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.timeOption,
                      selectedHour === h && styles.timeOptionSelected,
                    ]}
                    onPress={() => setSelectedHour(h)}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        selectedHour === h && styles.timeOptionTextSelected,
                      ]}
                    >
                      {String(h).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.timeSeparator}>:</Text>
              <ScrollView style={styles.timeColumn} showsVerticalScrollIndicator={false}>
                {minutes.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.timeOption,
                      selectedMinute === m && styles.timeOptionSelected,
                    ]}
                    onPress={() => setSelectedMinute(m)}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        selectedMinute === m && styles.timeOptionTextSelected,
                      ]}
                    >
                      {String(m).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>決定</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputPlaceholder: {},
  inputText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  placeholderText: {
    color: '#bdc3c7',
  },
  inputIcon: {
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '90%',
    maxWidth: 360,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navButton: {
    padding: 8,
  },
  navText: {
    fontSize: 16,
    color: '#3498db',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: '#3498db',
    borderRadius: 20,
  },
  dayText: {
    fontSize: 15,
    color: '#2c3e50',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  timePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '75%',
    maxWidth: 300,
    maxHeight: 400,
  },
  timePickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 16,
  },
  timeColumns: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 200,
  },
  timeColumn: {
    flex: 1,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginHorizontal: 8,
  },
  timeOption: {
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeOptionSelected: {
    backgroundColor: '#3498db',
  },
  timeOptionText: {
    fontSize: 18,
    color: '#2c3e50',
    fontVariant: ['tabular-nums'],
  },
  timeOptionTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  confirmButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
