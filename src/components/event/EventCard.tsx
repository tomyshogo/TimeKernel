import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarEvent } from '../../types';
import { EVENT_TYPE_LABELS } from '../../utils/constants';
import { useAuthStore } from '../../stores/authStore';

interface Props {
  event: CalendarEvent;
  onPress: () => void;
  index?: number;
}

const TYPE_ICONS: Record<string, string> = {
  class: 'school-outline',
  event: 'calendar-outline',
  shift: 'wallet-outline',
};

const AVATAR_STORAGE_KEY = 'user_avatar_uri';

function CreatorAvatar({ event }: { event: CalendarEvent }) {
  const uid = useAuthStore((s) => s.uid);
  const profile = useAuthStore((s) => s.profile);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const isMyEvent = event.createdBy === uid;

  useEffect(() => {
    if (isMyEvent) {
      AsyncStorage.getItem(AVATAR_STORAGE_KEY).then((uri) => setAvatarUri(uri));
    }
  }, [isMyEvent]);

  // 時間割・試験は表示しない
  if (event.id.startsWith('timetable_') || event.id.startsWith('exam_')) return null;

  if (isMyEvent && avatarUri) {
    return <Image source={{ uri: avatarUri }} style={styles.creatorAvatar} />;
  }

  const initial = isMyEvent
    ? (profile?.name?.charAt(0) || '?')
    : (event.createdBy?.charAt(0) || '?').toUpperCase();

  return (
    <View style={[styles.creatorAvatarFallback, { backgroundColor: isMyEvent ? '#3498db' : '#95a5a6' }]}>
      <Text style={styles.creatorAvatarText}>{initial}</Text>
    </View>
  );
}

export function EventCard({ event, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
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
            <CreatorAvatar event={event} />
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
            {event.isAllDay
              ? (event.endDate && event.endDate !== event.date
                ? `終日 (${event.date} 〜 ${event.endDate})`
                : '終日')
              : `${event.startTime} - ${event.endTime}`}
          </Text>
        </View>
        {event.url && (
          <TouchableOpacity
            style={styles.urlRow}
            onPress={(e) => {
              e.stopPropagation?.();
              Linking.openURL(event.url!);
            }}
            activeOpacity={0.6}
          >
            <Ionicons name="link-outline" size={13} color="#3498db" />
            <Text style={styles.urlText} numberOfLines={1}>公式サイトを検索</Text>
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
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
  pressed: {
    opacity: 0.7,
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
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  urlText: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '600',
  },
  creatorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  creatorAvatarFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
});
