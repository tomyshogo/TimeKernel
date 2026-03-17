import React, { useEffect, useCallback } from 'react';
import { Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

interface ToastStore {
  toast: ToastMessage | null;
  show: (text: string, type?: ToastType) => void;
  clear: () => void;
}

let toastId = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toast: null,
  show: (text, type = 'success') => {
    toastId += 1;
    set({ toast: { id: toastId, text, type } });
  },
  clear: () => set({ toast: null }),
}));

/** Alert.alert の代わりに使うヘルパー */
export const toast = {
  success: (text: string) => useToastStore.getState().show(text, 'success'),
  error: (text: string) => useToastStore.getState().show(text, 'error'),
  info: (text: string) => useToastStore.getState().show(text, 'info'),
};

const TOAST_COLORS: Record<ToastType, { bg: string; text: string }> = {
  success: { bg: '#2ecc71', text: '#fff' },
  error: { bg: '#e74c3c', text: '#fff' },
  info: { bg: '#3498db', text: '#fff' },
};

const DISPLAY_DURATION = 2500;
const ANIM_DURATION = 250;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ToastContainer() {
  const insets = useSafeAreaInsets();
  const toastMsg = useToastStore((s) => s.toast);
  const clear = useToastStore((s) => s.clear);

  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const dismiss = useCallback(() => {
    clear();
  }, [clear]);

  useEffect(() => {
    if (!toastMsg) return;

    translateY.value = withTiming(0, {
      duration: ANIM_DURATION,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(1, { duration: ANIM_DURATION });

    // Auto dismiss
    translateY.value = withDelay(
      DISPLAY_DURATION,
      withTiming(-100, { duration: ANIM_DURATION, easing: Easing.in(Easing.cubic) })
    );
    opacity.value = withDelay(
      DISPLAY_DURATION,
      withTiming(0, { duration: ANIM_DURATION }, (finished) => {
        if (finished) runOnJS(dismiss)();
      })
    );
  }, [toastMsg?.id]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!toastMsg) return null;

  const colors = TOAST_COLORS[toastMsg.type];

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8, backgroundColor: colors.bg },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.text, { color: colors.text }]}>{toastMsg.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    maxWidth: Math.min(SCREEN_WIDTH - 32, 480),
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
