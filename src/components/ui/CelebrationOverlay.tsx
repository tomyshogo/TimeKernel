import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { create } from 'zustand';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CelebrationStore {
  isActive: boolean;
  trigger: () => void;
  dismiss: () => void;
}

export const useCelebrationStore = create<CelebrationStore>((set) => ({
  isActive: false,
  trigger: () => set({ isActive: true }),
  dismiss: () => set({ isActive: false }),
}));

export const celebrate = () => useCelebrationStore.getState().trigger();

const CONFETTI_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#e91e63'];
const CONFETTI_COUNT = 24;

interface ConfettiPieceProps {
  index: number;
  onComplete: () => void;
}

function ConfettiPiece({ index, onComplete }: ConfettiPieceProps) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(SCREEN_WIDTH / 2);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    const targetX = Math.random() * SCREEN_WIDTH;
    const delay = index * 40;
    const duration = 1200 + Math.random() * 600;

    scale.value = withDelay(delay, withSpring(1, { damping: 8 }));
    translateX.value = withDelay(
      delay,
      withTiming(targetX, { duration, easing: Easing.out(Easing.cubic) })
    );
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT * 0.7, { duration, easing: Easing.in(Easing.quad) })
    );
    rotation.value = withDelay(
      delay,
      withTiming(360 * (1 + Math.random() * 2), { duration })
    );
    opacity.value = withDelay(
      delay + duration * 0.6,
      withTiming(0, { duration: duration * 0.4 }, (finished) => {
        if (finished && index === CONFETTI_COUNT - 1) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 6 + Math.random() * 6;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          width: size,
          height: size * 1.5,
          backgroundColor: color,
          borderRadius: size / 4,
        },
        animatedStyle,
      ]}
    />
  );
}

export function CelebrationOverlay() {
  const isActive = useCelebrationStore((s) => s.isActive);
  const dismiss = useCelebrationStore((s) => s.dismiss);

  // Checkmark animation
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      checkScale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12 })
      );
      checkOpacity.value = withTiming(1, { duration: 200 });

      // Auto dismiss
      checkOpacity.value = withDelay(
        1800,
        withTiming(0, { duration: 300 })
      );
    } else {
      checkScale.value = 0;
      checkOpacity.value = 0;
    }
  }, [isActive]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  if (!isActive) return null;

  return (
    <>
      {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
        <ConfettiPiece key={i} index={i} onComplete={dismiss} />
      ))}
      <Animated.View style={[styles.checkContainer, checkStyle]}>
        <Animated.Text style={styles.checkText}>✓</Animated.Text>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9998,
  },
  checkContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 40,
    left: SCREEN_WIDTH / 2 - 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  checkText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: '800',
  },
});
