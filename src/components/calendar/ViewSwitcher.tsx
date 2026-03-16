import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CalendarViewType } from '../../stores/uiStore';

interface Props {
  current: CalendarViewType;
  onChange: (view: CalendarViewType) => void;
}

const VIEW_OPTIONS: { key: CalendarViewType; label: string }[] = [
  { key: 'month', label: '月' },
  { key: 'week', label: '週' },
  { key: '3day', label: '3日' },
  { key: 'day', label: '日' },
  { key: 'agenda', label: '一覧' },
];

export function ViewSwitcher({ current, onChange }: Props) {
  return (
    <View style={styles.container}>
      {VIEW_OPTIONS.map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          style={[styles.tab, current === key && styles.activeTab]}
          onPress={() => onChange(key)}
        >
          <Text style={[styles.label, current === key && styles.activeLabel]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 2,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  activeLabel: {
    color: '#3498db',
    fontWeight: '700',
  },
});
