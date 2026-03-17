import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInRight,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { CalendarEvent } from '../../types';
import { EVENT_TYPE_LABELS } from '../../utils/constants';

interface Props {
  event: CalendarEvent;
  onPress: () => void;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TYPE_ICONS: Record<string, string> = {
  class: 'school-outline',
  event: 'calendar-outline',
  shift: 'wallet-outline',
};

export function EventCard({ event, onPress, index = 0 }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 200 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }); }}
      entering={FadeInRight.delay(index * 50).duration(300).springify()}
    >
      <View style={[styles.colorAccent, { backgroundColor: event.color }]}>
        <Ionicons
          name={(TYPE_ICONS[event.type] || 'ellipse') as any}
          size={14}
          color="#fff"
        />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
            {event.hasPendingWrites && (
              <View style={styles.pendingBadge}>
                <Ionicons name="cloud-upload-outline" size={10} color="#fff" />
              </View>
            )}
          </View>
          <View style={[styles.typeBadge, { backgroundColor: event.color + '15' }]}>
            <Text style={[styles.typeText, { color: event.color }]}>
              {EVENT_TYPE_LABELS[event.type]}
            </Text>
          </View>
        </View>
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={13} color="#95a5a6" />
          <Text style={styles.time}>
            {event.startTime} - {event.endTime}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  colorAccent: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 12,
    paddingLeft: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    flex: 1,
  },
  pendingBadge: {
    backgroundColor: '#f39c12',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  time: {
    fontSize: 13,
    color: '#7f8c8d',
    fontWeight: '500',
  },
});
