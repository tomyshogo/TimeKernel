import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  /** プレス時のスケールアニメーション */
  pressable?: boolean;
}

const SPRING_CONFIG = { damping: 15, stiffness: 150 };

export function Card({ children, style, pressable = false }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!pressable) {
    return (
      <Animated.View style={[styles.card, style]}>{children}</Animated.View>
    );
  }

  return (
    <Animated.View
      style={[styles.card, animatedStyle, style]}
      onTouchStart={() => {
        scale.value = withSpring(0.97, SPRING_CONFIG);
      }}
      onTouchEnd={() => {
        scale.value = withSpring(1, SPRING_CONFIG);
      }}
      onTouchCancel={() => {
        scale.value = withSpring(1, SPRING_CONFIG);
      }}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
});
