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
import {
  isLocalCalendarId,
  addLocalEvent,
  updateLocalEvent,
  deleteLocalEvent,
  getLocalEventsByMonth,
  getLocalEventsByDate,
  getLocalEventById,
  getLocalExternalEventIds,
  onLocalEventsChanged,
} from './localEventService';

// --- Firestore helpers (internal) ---

function eventsCol(calendarId: string) {
  return collection(db, 'calendars', calendarId, 'events');
}

async function addFirestoreEvent(
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

async function updateFirestoreEvent(
  calendarId: string,
  eventId: string,
  data: Partial<CalendarEventInput>
): Promise<void> {
  await updateDoc(doc(db, 'calendars', calendarId, 'events', eventId), data);
}

async function deleteFirestoreEvent(
  calendarId: string,
  eventId: string
): Promise<void> {
  await deleteDoc(doc(db, 'calendars', calendarId, 'events', eventId));
}

async function getFirestoreExternalEventIds(
  calendarId: string,
  provider: string
): Promise<Map<string, string>> {
  const q = query(
    eventsCol(calendarId),
    where('externalProvider', '==', provider)
  );
  const snap = await getDocs(q);
  const map = new Map<string, string>();
  for (const d of snap.docs) {
    const externalId = d.data().externalId;
    if (externalId) map.set(externalId, d.id);
  }
  return map;
}

async function getFirestoreEventById(
  calendarId: string,
  eventId: string
): Promise<CalendarEvent | null> {
  const snap = await getDoc(doc(db, 'calendars', calendarId, 'events', eventId));
  if (!snap.exists()) return null;
  return { id: snap.id, calendarId, ...snap.data() } as CalendarEvent;
}

// --- Public API (routing facade) ---

export async function addEvent(
  calendarId: string,
  event: CalendarEventInput
): Promise<string> {
  if (isLocalCalendarId(calendarId)) {
    return addLocalEvent(calendarId, event);
  }
  return addFirestoreEvent(calendarId, event);
}

export async function updateEvent(
  calendarId: string,
  eventId: string,
  data: Partial<CalendarEventInput>
): Promise<void> {
  if (isLocalCalendarId(calendarId)) {
    updateLocalEvent(calendarId, eventId, data);
    return;
  }
  return updateFirestoreEvent(calendarId, eventId, data);
}

export async function deleteEvent(
  calendarId: string,
  eventId: string
): Promise<void> {
  if (isLocalCalendarId(calendarId)) {
    deleteLocalEvent(calendarId, eventId);
    return;
  }
  return deleteFirestoreEvent(calendarId, eventId);
}

export async function getEventById(
  calendarId: string,
  eventId: string
): Promise<CalendarEvent | null> {
  if (isLocalCalendarId(calendarId)) {
    return getLocalEventById(calendarId, eventId);
  }
  return getFirestoreEventById(calendarId, eventId);
}

export async function getExternalEventIds(
  calendarId: string,
  provider: string
): Promise<Map<string, string>> {
  if (isLocalCalendarId(calendarId)) {
    return getLocalExternalEventIds(calendarId, provider);
  }
  return getFirestoreExternalEventIds(calendarId, provider);
}

/**
 * 指定カレンダー内の外部プロバイダーのイベントを全削除
 */
export async function deleteExternalEvents(
  calendarId: string,
  provider: string
): Promise<void> {
  const eventIds = await getExternalEventIds(calendarId, provider);
  for (const [, eventId] of eventIds) {
    await deleteEvent(calendarId, eventId);
  }
}

/**
 * カレンダーごとのサブコレクションクエリでイベントを取得。
 * calendarIds の各カレンダーに対して onSnapshot を張り、結果をマージ。
 * ローカルカレンダーはSQLiteから取得し、変更通知でリアクティブに更新。
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

  const localCalIds = calendarIds.filter((id) => isLocalCalendarId(id));
  const firestoreCalIds = calendarIds.filter((id) => !isLocalCalendarId(id));

  const eventMap = new Map<string, CalendarEvent[]>();
  const unsubscribes: (() => void)[] = [];

  function mergeAndCallback() {
    const all = Array.from(eventMap.values()).flat();
    all.sort((a, b) => a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? ''));
    callback(all);
  }

  // Local calendars
  if (localCalIds.length > 0) {
    const refreshLocal = () => {
      const localEvents = getLocalEventsByMonth(localCalIds, yearMonth);
      eventMap.set('__local__', localEvents);
      mergeAndCallback();
    };
    refreshLocal();
    const unsubLocal = onLocalEventsChanged(refreshLocal);
    unsubscribes.push(unsubLocal);
  }

  // Firestore calendars
  for (const calId of firestoreCalIds) {
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
      mergeAndCallback();
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

  const localCalIds = calendarIds.filter((id) => isLocalCalendarId(id));
  const firestoreCalIds = calendarIds.filter((id) => !isLocalCalendarId(id));

  const eventMap = new Map<string, CalendarEvent[]>();
  const unsubscribes: (() => void)[] = [];

  function mergeAndCallback() {
    const all = Array.from(eventMap.values()).flat();
    all.sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
    callback(all);
  }

  // Local calendars
  if (localCalIds.length > 0) {
    const refreshLocal = () => {
      const localEvents = getLocalEventsByDate(localCalIds, date);
      eventMap.set('__local__', localEvents);
      mergeAndCallback();
    };
    refreshLocal();
    const unsubLocal = onLocalEventsChanged(refreshLocal);
    unsubscribes.push(unsubLocal);
  }

  // Firestore calendars
  for (const calId of firestoreCalIds) {
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
      mergeAndCallback();
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
 * ローカルカレンダーでは不要（members は常に [createdBy]）。
 */
export async function syncEventMembers(
  calendarId: string,
  newMembers: string[]
): Promise<void> {
  if (isLocalCalendarId(calendarId)) return;

  const snapshot = await getDocs(eventsCol(calendarId));
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  for (const eventDoc of snapshot.docs) {
    batch.update(eventDoc.ref, { members: newMembers });
  }
  await batch.commit();
}
