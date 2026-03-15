import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { EventForm } from '../../src/components/event/EventForm';
import { useCalendars } from '../../src/hooks/useCalendars';
import { useAuthStore } from '../../src/stores/authStore';
import { addEvent } from '../../src/services/eventService';
import { CalendarEventInput } from '../../src/types';

export default function NewEventScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const uid = useAuthStore((s) => s.uid);
  const { calendars, selectedCalendarIds } = useCalendars();

  const handleSubmit = async (calendarId: string, event: CalendarEventInput) => {
    await addEvent(calendarId, event);
    router.back();
  };

  if (!uid || calendars.length === 0) return null;

  return (
    <EventForm
      initialValues={{ date: date || '' }}
      calendars={calendars}
      selectedCalendarId={selectedCalendarIds[0] || calendars[0].id}
      onSubmit={handleSubmit}
      uid={uid}
    />
  );
}
