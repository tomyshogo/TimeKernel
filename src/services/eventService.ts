import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { CalendarEvent, CalendarEventInput } from '../types';

function eventsCol(calendarId: string) {
  return collection(db, 'calendars', calendarId, 'events');
}

export async function addEvent(
  calendarId: string,
  event: CalendarEventInput
): Promise<string> {
  const docRef = await addDoc(eventsCol(calendarId), {
    ...event,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateEvent(
  calendarId: string,
  eventId: string,
  data: Partial<CalendarEventInput>
): Promise<void> {
  await updateDoc(doc(db, 'calendars', calendarId, 'events', eventId), data);
}

export async function deleteEvent(
  calendarId: string,
  eventId: string
): Promise<void> {
  await deleteDoc(doc(db, 'calendars', calendarId, 'events', eventId));
}

export function subscribeToEventsByMonth(
  calendarId: string,
  yearMonth: string,
  callback: (events: CalendarEvent[]) => void
): Unsubscribe {
  const [year, month] = yearMonth.split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

  const q = query(
    eventsCol(calendarId),
    where('date', '>=', startDate),
    where('date', '<', endDate),
    orderBy('date'),
    orderBy('startTime')
  );

  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(
      (d) =>
        ({
          id: d.id,
          calendarId,
          ...d.data(),
          hasPendingWrites: d.metadata.hasPendingWrites,
        }) as CalendarEvent
    );
    callback(events);
  });
}

export function subscribeToEventsByDate(
  calendarId: string,
  date: string,
  callback: (events: CalendarEvent[]) => void
): Unsubscribe {
  const q = query(
    eventsCol(calendarId),
    where('date', '==', date),
    orderBy('startTime')
  );

  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(
      (d) =>
        ({
          id: d.id,
          calendarId,
          ...d.data(),
          hasPendingWrites: d.metadata.hasPendingWrites,
        }) as CalendarEvent
    );
    callback(events);
  });
}
