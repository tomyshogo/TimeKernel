import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated as RNAnimated } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';

interface SwipeAction {
  label: string;
  color: string;
  onPress: () => void;
}

interface Props {
  children: React.ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  onSwipeComplete?: () => void;
}

export function SwipeableRow({ children, leftAction, rightAction }: Props) {
  const swipeableRef = useRef<Swipeable>(null);

  const close = useCallback(() => {
    swipeableRef.current?.close();
  }, []);

  const renderLeftActions = useCallback(
    (progress: RNAnimated.AnimatedInterpolation<number>) => {
      if (!leftAction) return null;
      const translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-80, 0],
      });
      return (
        <RectButton
          style={[styles.actionButton, { backgroundColor: leftAction.color }]}
          onPress={() => {
            leftAction.onPress();
            close();
          }}
        >
          <RNAnimated.Text
            style={[styles.actionText, { transform: [{ translateX }] }]}
          >
            {leftAction.label}
          </RNAnimated.Text>
        </RectButton>
      );
    },
    [leftAction, close]
  );

  const renderRightActions = useCallback(
    (progress: RNAnimated.AnimatedInterpolation<number>) => {
      if (!rightAction) return null;
      const translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [80, 0],
      });
      return (
        <RectButton
          style={[styles.actionButton, { backgroundColor: rightAction.color }]}
          onPress={() => {
            rightAction.onPress();
            close();
          }}
        >
          <RNAnimated.Text
            style={[styles.actionText, { transform: [{ translateX }] }]}
          >
            {rightAction.label}
          </RNAnimated.Text>
        </RectButton>
      );
    },
    [rightAction, close]
  );

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={leftAction ? renderLeftActions : undefined}
      renderRightActions={rightAction ? renderRightActions : undefined}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  actionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
