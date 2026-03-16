import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { CalendarEvent } from '../../types';

const HOUR_HEIGHT = 60;
const LONG_PRESS_DURATION = 300;

interface Props {
  event: CalendarEvent;
  top: number;
  height: number;
  left: number;
  right: number;
  onPress: (event: CalendarEvent) => void;
  onDragStart: (event: CalendarEvent) => void;
  onDragUpdate: (x: number, y: number) => void;
  onDragEnd: () => void;
}

export function DraggableEventBlock({
  event,
  top,
  height,
  left,
  right,
  onPress,
  onDragStart,
  onDragUpdate,
  onDragEnd,
}: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const isDragging = useSharedValue(false);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const longPress = Gesture.LongPress()
    .minDuration(LONG_PRESS_DURATION)
    .onStart(() => {
      isDragging.value = true;
      scale.value = withSpring(1.05);
      runOnJS(onDragStart)(event);
    });

  const pan = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((_, state) => {
      if (isDragging.value) {
        state.activate();
      } else {
        state.fail();
      }
    })
    .onStart((e) => {
      startX.value = e.absoluteX;
      startY.value = e.absoluteY;
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      runOnJS(onDragUpdate)(e.absoluteX, e.absoluteY);
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      isDragging.value = false;
      runOnJS(onDragEnd)();
    });

  const tap = Gesture.Tap().onEnd(() => {
    if (!isDragging.value) {
      runOnJS(onPress)(event);
    }
  });

  const composed = Gesture.Simultaneous(
    longPress,
    Gesture.Simultaneous(pan, tap)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: isDragging.value ? 100 : 1,
    opacity: isDragging.value ? 0.85 : 1,
    shadowOpacity: isDragging.value ? 0.3 : 0,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          styles.eventBlock,
          {
            top,
            height: Math.max(height, 20),
            left,
            right,
            backgroundColor: event.color + 'DD',
          },
          animatedStyle,
        ]}
      >
        <Text style={styles.eventTitle} numberOfLines={1}>
          {event.title}
        </Text>
        {height > 28 && (
          <Text style={styles.eventTime}>
            {event.startTime}-{event.endTime}
          </Text>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  eventBlock: {
    position: 'absolute',
    borderRadius: 4,
    padding: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  eventTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  eventTime: {
    fontSize: 10,
    color: '#ffffffCC',
  },
});
