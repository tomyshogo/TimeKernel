import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { EventForm } from '../../src/components/event/EventForm';
import { useCalendars } from '../../src/hooks/useCalendars';
import { useAuthStore } from '../../src/stores/authStore';
import {
  updateEvent,
  deleteEvent,
} from '../../src/services/eventService';
import {
  scheduleEventReminder,
  cancelEventNotifications,
} from '../../src/services/notificationService';
import { CalendarEvent, CalendarEventInput } from '../../src/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../src/services/firebase';

export default function EditEventScreen() {
  const router = useRouter();
  const { id, calendarId } = useLocalSearchParams<{
    id: string;
    calendarId: string;
  }>();
  const uid = useAuthStore((s) => s.uid);
  const settings = useAuthStore((s) => s.settings);
  const { calendars } = useCalendars();
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!calendarId || !id) return;
      const snap = await getDoc(
        doc(db, 'calendars', calendarId, 'events', id)
      );
      if (snap.exists()) {
        setEvent({ id: snap.id, calendarId, ...snap.data() } as CalendarEvent);
      }
      setLoading(false);
    };
    fetchEvent();
  }, [id, calendarId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (!event || !uid) {
    return (
      <View style={styles.center}>
        <Text>予定が見つかりません</Text>
      </View>
    );
  }

  const handleSubmit = async (_calId: string, data: CalendarEventInput) => {
    await updateEvent(calendarId!, id!, data);
    // 通知を再スケジュール
    await cancelEventNotifications(id!);
    const notifSettings = settings.notifications;
    if (notifSettings?.enabled) {
      await scheduleEventReminder(
        { ...data, id: id!, calendarId: calendarId!, members: [], createdAt: null as any },
        notifSettings.reminderMinutes,
        notifSettings
      );
    }
    router.back();
  };

  const handleDelete = async () => {
    if (event.createdBy !== uid) return;
    await cancelEventNotifications(id!);
    await deleteEvent(calendarId!, id!);
    router.back();
  };

  return (
    <EventForm
      initialValues={event}
      calendars={calendars}
      selectedCalendarId={calendarId!}
      onSubmit={handleSubmit}
      onDelete={event.createdBy === uid ? handleDelete : undefined}
      isEdit
      uid={uid}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
