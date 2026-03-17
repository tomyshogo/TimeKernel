import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { formatDisplayMonth } from '../../utils/dateHelpers';
import * as Haptics from 'expo-haptics';

interface Props {
  month: Date;
  onPrev: () => void;
  onNext: () => void;
}

export function CalendarHeader({ month, onPrev, onNext }: Props) {
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

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePrev} hitSlop={12}>
        <Animated.View style={[styles.arrowBtn, leftStyle]}>
          <Ionicons name="chevron-back" size={20} color="#3498db" />
        </Animated.View>
      </Pressable>

      <Animated.Text
        key={month.toISOString()}
        entering={FadeIn.duration(200)}
        style={styles.title}
      >
        {formatDisplayMonth(month)}
      </Animated.Text>

      <Pressable onPress={handleNext} hitSlop={12}>
        <Animated.View style={[styles.arrowBtn, rightStyle]}>
          <Ionicons name="chevron-forward" size={20} color="#3498db" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: 0.5,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
