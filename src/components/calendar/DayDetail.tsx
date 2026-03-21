import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { CalendarEvent } from '../../types';
import { EventCard } from '../event/EventCard';

interface Props {
  date: string;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
}

function SwipeableEventCard({
  event,
  onPress,
  onDelete,
}: {
  event: CalendarEvent;
  onPress: () => void;
  onDelete?: () => void;
}) {
  const renderRightActions = useCallback(
    (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      const scale = dragX.interpolate({
        inputRange: [-80, 0],
        outputRange: [1, 0.5],
        extrapolate: 'clamp',
      });

      return (
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => {
            Alert.alert(
              '予定を削除',
              `「${event.title}」を削除しますか？`,
              [
                { text: 'キャンセル', style: 'cancel' },
                { text: '削除', style: 'destructive', onPress: onDelete },
              ]
            );
          }}
        >
          <Animated.View style={[styles.deleteContent, { transform: [{ scale }] }]}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteText}>削除</Text>
          </Animated.View>
        </TouchableOpacity>
      );
    },
    [event.title, onDelete]
  );

  if (!onDelete || event.id.startsWith('timetable_') || event.id.startsWith('exam_')) {
    return <EventCard event={event} onPress={onPress} />;
  }

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <EventCard event={event} onPress={onPress} />
    </Swipeable>
  );
}

export function DayDetail({ date, events, onEventPress, onDeleteEvent }: Props) {
  const router = useRouter();
  const dayEvents = events.filter((e) => {
    if (e.date === date) return true;
    if (e.endDate && e.date <= date && e.endDate >= date) return true;
    return false;
  });

  return (
    <View style={styles.container}>
      {dayEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>予定はありません</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push(`/event/new?date=${date}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>+ 予定を追加</Text>
          </TouchableOpacity>
        </View>
      ) : (
        dayEvents.map((item) => (
          <SwipeableEventCard
            key={item.id}
            event={item}
            onPress={() => onEventPress(item)}
            onDelete={onDeleteEvent ? () => onDeleteEvent(item) : undefined}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#95a5a6',
    fontSize: 15,
    marginBottom: 16,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3498db',
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteAction: {
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 14,
    marginVertical: 4,
    marginLeft: 4,
  },
  deleteContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
