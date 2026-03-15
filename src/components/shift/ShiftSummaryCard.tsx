import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';

interface Props {
  totalHours: number;
  totalPay: number;
  month: string;
}

export function ShiftSummaryCard({ totalHours, totalPay, month }: Props) {
  return (
    <Card>
      <Text style={styles.month}>{month}</Text>
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{totalHours}h</Text>
          <Text style={styles.statLabel}>勤務時間</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {totalPay.toLocaleString()}円
          </Text>
          <Text style={styles.statLabel}>見込み給料</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  month: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2ecc71',
  },
  statLabel: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
});
