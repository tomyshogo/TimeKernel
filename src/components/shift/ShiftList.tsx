import React from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { CalendarEvent } from '../../types';
import { calculateShiftPay } from '../../utils/salary';
import { NightShiftSettings } from '../../types';
import { formatDisplayDate, parseDate } from '../../utils/dateHelpers';
import { SwipeableRow } from '../ui/SwipeableRow';
import { toast } from '../ui/Toast';

interface Props {
  shifts: CalendarEvent[];
  nightShift: NightShiftSettings;
  onDelete?: (shift: CalendarEvent) => void;
}

export function ShiftList({ shifts, nightShift, onDelete }: Props) {
  if (shifts.length === 0) {
    return <Text style={styles.empty}>今月のシフトはありません</Text>;
  }

  return (
    <FlatList
      data={shifts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const result = calculateShiftPay(
          item.startTime,
          item.endTime,
          item.hourlyWage || 0,
          nightShift
        );
        return (
          <SwipeableRow
            rightAction={
              onDelete
                ? {
                    label: '削除',
                    color: '#e74c3c',
                    onPress: () => {
                      Alert.alert('確認', 'このシフトを削除しますか？', [
                        { text: 'キャンセル' },
                        {
                          text: '削除',
                          style: 'destructive',
                          onPress: () => onDelete(item),
                        },
                      ]);
                    },
                  }
                : undefined
            }
          >
            <View style={styles.item}>
              <View style={styles.left}>
                <Text style={styles.date}>
                  {formatDisplayDate(parseDate(item.date))}
                </Text>
                <Text style={styles.time}>
                  {item.startTime} - {item.endTime}
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.hours}>{result.hours}h</Text>
                <Text style={styles.pay}>{result.pay.toLocaleString()}円</Text>
              </View>
            </View>
          </SwipeableRow>
        );
      }}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    textAlign: 'center',
    color: '#95a5a6',
    paddingVertical: 20,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  left: {},
  right: {
    alignItems: 'flex-end',
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  time: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  hours: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  pay: {
    fontSize: 13,
    color: '#2ecc71',
    fontWeight: '600',
    marginTop: 2,
  },
});
