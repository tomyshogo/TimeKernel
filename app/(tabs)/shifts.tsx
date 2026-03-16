import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ShiftSummaryCard } from '../../src/components/shift/ShiftSummaryCard';
import { ShiftList } from '../../src/components/shift/ShiftList';
import { useEvents } from '../../src/hooks/useEvents';
import { useShiftSummary } from '../../src/hooks/useShiftSummary';
import { useUIStore } from '../../src/stores/uiStore';
import { useAuthStore } from '../../src/stores/authStore';
import { formatDisplayMonth } from '../../src/utils/dateHelpers';

export default function ShiftsScreen() {
  const uid = useAuthStore((s) => s.uid);
  const currentMonth = useUIStore((s) => s.currentMonth);
  const nightShift = useAuthStore((s) => s.settings.nightShift);
  const { events } = useEvents(uid, currentMonth);

  const shiftEvents = events.filter((e) => e.type === 'shift');
  const { totalHours, totalPay } = useShiftSummary(events);

  return (
    <ScrollView style={styles.container}>
      <ShiftSummaryCard
        totalHours={totalHours}
        totalPay={totalPay}
        month={formatDisplayMonth(currentMonth)}
      />
      <View style={styles.list}>
        <ShiftList shifts={shiftEvents} nightShift={nightShift} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 8,
  },
  list: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
  },
});
