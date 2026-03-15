import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatDisplayMonth } from '../../utils/dateHelpers';

interface Props {
  month: Date;
  onPrev: () => void;
  onNext: () => void;
}

export function CalendarHeader({ month, onPrev, onNext }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPrev} style={styles.arrow}>
        <Text style={styles.arrowText}>{'<'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{formatDisplayMonth(month)}</Text>
      <TouchableOpacity onPress={onNext} style={styles.arrow}>
        <Text style={styles.arrowText}>{'>'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  arrow: {
    padding: 8,
  },
  arrowText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3498db',
  },
});
