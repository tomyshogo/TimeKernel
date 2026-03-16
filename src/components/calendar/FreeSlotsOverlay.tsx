import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FreeSlot } from '../../hooks/useFreeSlots';

const HOUR_HEIGHT = 60;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

interface Props {
  slots: FreeSlot[];
  date: string;
  left: number;
  right: number;
  onSlotPress?: (slot: FreeSlot) => void;
}

export function FreeSlotsOverlay({ slots, date, left, right, onSlotPress }: Props) {
  const daySlots = slots.filter((s) => s.date === date);

  return (
    <>
      {daySlots.map((slot, i) => {
        const startMin = timeToMinutes(slot.startTime);
        const endMin = timeToMinutes(slot.endTime);
        const top = (startMin / 60) * HOUR_HEIGHT;
        const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;

        return (
          <TouchableOpacity
            key={`${slot.date}-${slot.startTime}-${i}`}
            style={[
              styles.overlay,
              { top, height, left, right },
            ]}
            onPress={() => onSlotPress?.(slot)}
            activeOpacity={0.6}
          >
            <Text style={styles.label}>
              {slot.freeCount === slot.totalMembers
                ? '全員空き'
                : `${slot.freeCount}/${slot.totalMembers}人空き`}
            </Text>
          </TouchableOpacity>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.4)',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#27ae60',
  },
});
