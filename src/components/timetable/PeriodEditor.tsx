import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Period } from '../../types';

interface Props {
  periods: Period[];
  onUpdate: (periods: Period[]) => void;
}

export function PeriodEditor({ periods, onUpdate }: Props) {
  const handleChange = (
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    const updated = [...periods];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate(updated);
  };

  const addPeriod = () => {
    const lastPeriod = periods[periods.length - 1];
    const newPeriod: Period = {
      period: lastPeriod ? lastPeriod.period + 1 : 1,
      startTime: '',
      endTime: '',
    };
    onUpdate([...periods, newPeriod]);
  };

  const removePeriod = (index: number) => {
    Alert.alert('確認', `${periods[index].period}限を削除しますか？`, [
      { text: 'キャンセル' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          const updated = periods.filter((_, i) => i !== index);
          onUpdate(updated.map((p, i) => ({ ...p, period: i + 1 })));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {periods.map((period, index) => (
        <View key={index} style={styles.row}>
          <Text style={styles.periodNum}>{period.period}限</Text>
          <TextInput
            style={styles.input}
            value={period.startTime}
            onChangeText={(v) => handleChange(index, 'startTime', v)}
            placeholder="09:00"
          />
          <Text style={styles.dash}>-</Text>
          <TextInput
            style={styles.input}
            value={period.endTime}
            onChangeText={(v) => handleChange(index, 'endTime', v)}
            placeholder="10:30"
          />
          <TouchableOpacity onPress={() => removePeriod(index)}>
            <Text style={styles.remove}>x</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addButton} onPress={addPeriod}>
        <Text style={styles.addText}>+ 時限を追加</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodNum: {
    width: 36,
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    textAlign: 'center',
  },
  dash: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  remove: {
    fontSize: 18,
    color: '#e74c3c',
    paddingHorizontal: 8,
  },
  addButton: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginTop: 4,
  },
  addText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
  },
});
