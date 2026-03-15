import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TimetableSlot } from '../../types';

interface Props {
  slot: TimetableSlot | null;
  onPress: () => void;
}

export function SlotCell({ slot, onPress }: Props) {
  if (!slot) {
    return (
      <TouchableOpacity style={styles.empty} onPress={onPress}>
        <Text style={styles.plus}>+</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.filled, { backgroundColor: slot.color + '20' }]}
      onPress={onPress}
    >
      <Text style={[styles.subject, { color: slot.color }]} numberOfLines={2}>
        {slot.subject}
      </Text>
      <Text style={styles.room} numberOfLines={1}>
        {slot.room}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    height: 64,
    margin: 1,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  plus: {
    fontSize: 18,
    color: '#bdc3c7',
  },
  filled: {
    flex: 1,
    height: 64,
    margin: 1,
    borderRadius: 8,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subject: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  room: {
    fontSize: 9,
    color: '#7f8c8d',
    marginTop: 2,
  },
});
