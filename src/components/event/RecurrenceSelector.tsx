import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { RecurrenceRule, RecurrenceFrequency } from '../../types';

interface Props {
  value?: RecurrenceRule;
  onChange: (rule?: RecurrenceRule) => void;
}

const FREQUENCY_OPTIONS: { key: RecurrenceFrequency | 'none'; label: string }[] = [
  { key: 'none', label: 'なし' },
  { key: 'daily', label: '毎日' },
  { key: 'weekly', label: '毎週' },
  { key: 'biweekly', label: '隔週' },
  { key: 'monthly', label: '毎月' },
  { key: 'custom', label: 'カスタム' },
];

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function RecurrenceSelector({ value, onChange }: Props) {
  const [showUntil, setShowUntil] = useState(!!value?.until);

  const frequency = value?.frequency || 'none';

  const handleFrequencyChange = (freq: RecurrenceFrequency | 'none') => {
    if (freq === 'none') {
      onChange(undefined);
      return;
    }
    onChange({
      ...value,
      frequency: freq,
      daysOfWeek: freq === 'weekly' || freq === 'biweekly' ? value?.daysOfWeek || [] : undefined,
      interval: freq === 'custom' ? value?.interval || 2 : undefined,
    });
  };

  const toggleDayOfWeek = (day: number) => {
    if (!value) return;
    const current = value.daysOfWeek || [];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort();
    onChange({ ...value, daysOfWeek: updated });
  };

  return (
    <View>
      {/* 頻度選択 */}
      <View style={styles.options}>
        {FREQUENCY_OPTIONS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.option, frequency === key && styles.activeOption]}
            onPress={() => handleFrequencyChange(key)}
          >
            <Text style={[styles.optionText, frequency === key && styles.activeText]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 曜日選択（weekly / biweekly） */}
      {(frequency === 'weekly' || frequency === 'biweekly') && (
        <View style={styles.weekdays}>
          {WEEKDAYS.map((label, i) => {
            const active = value?.daysOfWeek?.includes(i);
            return (
              <TouchableOpacity
                key={i}
                style={[styles.weekday, active && styles.activeWeekday]}
                onPress={() => toggleDayOfWeek(i)}
              >
                <Text style={[styles.weekdayText, active && styles.activeWeekdayText]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* カスタム間隔 */}
      {frequency === 'custom' && (
        <View style={styles.customRow}>
          <TextInput
            style={styles.intervalInput}
            value={String(value?.interval || 2)}
            onChangeText={(t) => {
              const n = parseInt(t, 10);
              if (n > 0 && value) onChange({ ...value, interval: n });
            }}
            keyboardType="numeric"
          />
          <Text style={styles.intervalLabel}>日ごと</Text>
        </View>
      )}

      {/* 終了日 */}
      {value && (
        <View style={styles.untilRow}>
          <TouchableOpacity
            onPress={() => {
              setShowUntil(!showUntil);
              if (showUntil && value) {
                onChange({ ...value, until: undefined });
              }
            }}
          >
            <Text style={styles.untilToggle}>
              {showUntil ? '終了日を削除' : '終了日を設定'}
            </Text>
          </TouchableOpacity>
          {showUntil && (
            <TextInput
              style={styles.untilInput}
              value={value.until || ''}
              onChangeText={(t) => onChange({ ...value, until: t })}
              placeholder="2026-12-31"
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  activeOption: {
    backgroundColor: '#3498db',
  },
  optionText: {
    fontSize: 13,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  activeText: {
    color: '#fff',
  },
  weekdays: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  weekday: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeWeekday: {
    backgroundColor: '#3498db',
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  activeWeekdayText: {
    color: '#fff',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  intervalInput: {
    width: 60,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    textAlign: 'center',
  },
  intervalLabel: {
    fontSize: 14,
    color: '#2c3e50',
  },
  untilRow: {
    marginTop: 10,
    gap: 8,
  },
  untilToggle: {
    fontSize: 13,
    color: '#3498db',
    fontWeight: '600',
  },
  untilInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});
