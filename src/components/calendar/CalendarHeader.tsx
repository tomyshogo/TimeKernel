import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { formatDisplayMonth, addMonths, subMonths } from '../../utils/dateHelpers';
import * as Haptics from 'expo-haptics';

interface Props {
  month: Date;
  onPrev: () => void;
  onNext: () => void;
  onChangeMonth?: (date: Date) => void;
  showTimetable?: boolean;
  onToggleTimetable?: () => void;
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function CalendarHeader({ month, onPrev, onNext, onChangeMonth, showTimetable, onToggleTimetable }: Props) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(month.getFullYear());

  const leftScale = useSharedValue(1);
  const rightScale = useSharedValue(1);

  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ scale: leftScale.value }],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rightScale.value }],
  }));

  const handlePrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    leftScale.value = withSequence(
      withSpring(0.8, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    onPrev();
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    rightScale.value = withSequence(
      withSpring(0.8, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    onNext();
  };

  const handleTitlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPickerYear(month.getFullYear());
    setPickerVisible(true);
  };

  const handleSelectMonth = (m: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPickerVisible(false);
    onChangeMonth?.(new Date(pickerYear, m - 1, 1));
  };

  const currentYear = month.getFullYear();
  const currentMonthNum = month.getMonth() + 1;

  const prevMonth = subMonths(month, 1);
  const nextMonth = addMonths(month, 1);
  const prevLabel = `${prevMonth.getMonth() + 1}月`;
  const nextLabel = `${nextMonth.getMonth() + 1}月`;

  return (
    <View style={styles.headerWrapper}>
      <View style={styles.container}>
        <Pressable onPress={handlePrev} hitSlop={12}>
          <Animated.View style={[styles.arrowBtn, leftStyle]}>
            <Ionicons name="chevron-back" size={20} color="#3498db" />
          </Animated.View>
        </Pressable>

        <Pressable onPress={handleTitlePress}>
          <Animated.View
            key={month.toISOString()}
            entering={FadeIn.duration(200)}
            style={styles.titleRow}
          >
            <Text style={styles.title}>{formatDisplayMonth(month)}</Text>
            <Ionicons name="caret-down" size={12} color="#9aa5b4" style={styles.titleCaret} />
          </Animated.View>
        </Pressable>

        <Pressable onPress={handleNext} hitSlop={12}>
          <Animated.View style={[styles.arrowBtn, rightStyle]}>
            <Ionicons name="chevron-forward" size={20} color="#3498db" />
          </Animated.View>
        </Pressable>
      </View>
      <View style={styles.swipeHint}>
        <View style={styles.swipeHintSide}>
          <Ionicons name="chevron-back" size={12} color="#b0b8c8" />
          <Text style={styles.swipeHintText}>{prevLabel}</Text>
        </View>

        <View style={styles.swipeHintCenter}>
          <Ionicons name="swap-horizontal-outline" size={13} color="#c0c8d8" />
          <Text style={styles.swipeHintCenterText}>スワイプで月移動</Text>
        </View>

        {onToggleTimetable && (
          <Pressable style={styles.timetableToggle} onPress={onToggleTimetable}>
            <Ionicons name={showTimetable ? 'checkbox' : 'square-outline'} size={14} color={showTimetable ? '#3498db' : '#c0c8d8'} />
            <Text style={[styles.swipeHintCenterText, showTimetable && { color: '#3498db' }]}>時間割</Text>
          </Pressable>
        )}

        <View style={styles.swipeHintSide}>
          <Text style={styles.swipeHintText}>{nextLabel}</Text>
          <Ionicons name="chevron-forward" size={12} color="#b0b8c8" />
        </View>
      </View>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setPickerVisible(false)}>
          <Pressable style={styles.pickerCard} onPress={() => {}}>
            {/* Year selector */}
            <View style={styles.yearRow}>
              <Pressable
                onPress={() => setPickerYear((y) => y - 1)}
                hitSlop={8}
              >
                <Ionicons name="chevron-back" size={22} color="#3498db" />
              </Pressable>
              <Text style={styles.yearText}>{pickerYear}年</Text>
              <Pressable
                onPress={() => setPickerYear((y) => y + 1)}
                hitSlop={8}
              >
                <Ionicons name="chevron-forward" size={22} color="#3498db" />
              </Pressable>
            </View>

            {/* Month grid */}
            <View style={styles.monthGrid}>
              {MONTHS.map((m) => {
                const isSelected = pickerYear === currentYear && m === currentMonthNum;
                return (
                  <Pressable
                    key={m}
                    style={[styles.monthCell, isSelected && styles.monthCellSelected]}
                    onPress={() => handleSelectMonth(m)}
                  >
                    <Text style={[styles.monthCellText, isSelected && styles.monthCellTextSelected]}>
                      {m}月
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Today shortcut */}
            <Pressable
              style={styles.todayBtn}
              onPress={() => {
                const now = new Date();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPickerVisible(false);
                onChangeMonth?.(new Date(now.getFullYear(), now.getMonth(), 1));
              }}
            >
              <Text style={styles.todayBtnText}>今月に戻る</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {},
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: 0.5,
  },
  titleCaret: {
    marginLeft: 5,
    marginTop: 2,
  },
  arrowBtn: {
    width: 33,
    height: 33,
    borderRadius: 11,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  swipeHintSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  swipeHintCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timetableToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  swipeHintCenterText: {
    fontSize: 11,
    color: '#c0c8d8',
  },
  swipeHintText: {
    fontSize: 11,
    color: '#b0b8c8',
    fontWeight: '500',
  },
  // Picker modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerCard: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  yearText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  monthCell: {
    width: '31%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  monthCellSelected: {
    backgroundColor: '#3498db',
  },
  monthCellText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  monthCellTextSelected: {
    color: '#fff',
  },
  todayBtn: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f0f4ff',
  },
  todayBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
  },
});
