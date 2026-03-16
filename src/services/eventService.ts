import {
  collection,
  collectionGroup,
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
  getDoc,
  getDocs,
  writeBatch,
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
  const calSnap = await getDoc(doc(db, 'calendars', calendarId));
  const members: string[] = calSnap.exists() ? (calSnap.data().members ?? []) : [];

  const docRef = await addDoc(eventsCol(calendarId), {
    ...event,
    members,
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

/**
 * CollectionGroup クエリで全カレンダーのイベントを1本の onSnapshot で取得。
 * members 配列に uid が含まれるイベントだけを返す（セキュリティルールと一致）。
 */
export function subscribeToEventsByMonth(
  uid: string,
  yearMonth: string,
  callback: (events: CalendarEvent[]) => void
): Unsubscribe {
  const [year, month] = yearMonth.split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

  const q = query(
    collectionGroup(db, 'events'),
    where('members', 'array-contains', uid),
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
          calendarId: d.ref.parent.parent?.id ?? '',
          ...d.data(),
          hasPendingWrites: d.metadata.hasPendingWrites,
        }) as CalendarEvent
    );
    callback(events);
  });
}

export function subscribeToEventsByDate(
  uid: string,
  date: string,
  callback: (events: CalendarEvent[]) => void
): Unsubscribe {
  const q = query(
    collectionGroup(db, 'events'),
    where('members', 'array-contains', uid),
    where('date', '==', date),
    orderBy('startTime')
  );

  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(
      (d) =>
        ({
          id: d.id,
          calendarId: d.ref.parent.parent?.id ?? '',
          ...d.data(),
          hasPendingWrites: d.metadata.hasPendingWrites,
        }) as CalendarEvent
    );
    callback(events);
  });
}

/**
 * カレンダーのメンバー変更時に、そのカレンダー配下の全イベントの members を一括更新。
 * バッチ書き込みで Firestore の write 回数を最小化。
 */
export async function syncEventMembers(
  calendarId: string,
  newMembers: string[]
): Promise<void> {
  const snapshot = await getDocs(eventsCol(calendarId));
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  for (const eventDoc of snapshot.docs) {
    batch.update(eventDoc.ref, { members: newMembers });
  }
  await batch.commit();
}
