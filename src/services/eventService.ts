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
 * カレンダーごとのサブコレクションクエリでイベントを取得。
 * calendarIds の各カレンダーに対して onSnapshot を張り、結果をマージ。
 */
export function subscribeToEventsByMonth(
  calendarIds: string[],
  yearMonth: string,
  callback: (events: CalendarEvent[]) => void
): Unsubscribe {
  if (calendarIds.length === 0) {
    callback([]);
    return () => {};
  }

  const [year, month] = yearMonth.split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

  const eventMap = new Map<string, CalendarEvent[]>();
  const unsubscribes: Unsubscribe[] = [];

  for (const calId of calendarIds) {
    const q = query(
      eventsCol(calId),
      where('date', '>=', startDate),
      where('date', '<', endDate),
      orderBy('date'),
      orderBy('startTime')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      eventMap.set(
        calId,
        snapshot.docs.map(
          (d) =>
            ({
              id: d.id,
              calendarId: calId,
              ...d.data(),
              hasPendingWrites: d.metadata.hasPendingWrites,
            }) as CalendarEvent
        )
      );
      // 全カレンダーの結果をマージしてコールバック
      const all = Array.from(eventMap.values()).flat();
      all.sort((a, b) => a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? ''));
      callback(all);
    }, (error) => {
      console.warn('[subscribeToEventsByMonth]', calId, error.code, error.message);
      eventMap.set(calId, []);
    });

    unsubscribes.push(unsub);
  }

  return () => unsubscribes.forEach((u) => u());
}

export function subscribeToEventsByDate(
  calendarIds: string[],
  date: string,
  callback: (events: CalendarEvent[]) => void
): Unsubscribe {
  if (calendarIds.length === 0) {
    callback([]);
    return () => {};
  }

  const eventMap = new Map<string, CalendarEvent[]>();
  const unsubscribes: Unsubscribe[] = [];

  for (const calId of calendarIds) {
    const q = query(
      eventsCol(calId),
      where('date', '==', date),
      orderBy('startTime')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      eventMap.set(
        calId,
        snapshot.docs.map(
          (d) =>
            ({
              id: d.id,
              calendarId: calId,
              ...d.data(),
              hasPendingWrites: d.metadata.hasPendingWrites,
            }) as CalendarEvent
        )
      );
      const all = Array.from(eventMap.values()).flat();
      all.sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
      callback(all);
    }, (error) => {
      console.warn('[subscribeToEventsByDate]', calId, error.code, error.message);
      eventMap.set(calId, []);
    });

    unsubscribes.push(unsub);
  }

  return () => unsubscribes.forEach((u) => u());
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
