import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { randomUUID } from 'expo-crypto';
import { db } from './firebase';
import { Calendar } from '../types';
import { addCalendarToUser, removeCalendarFromUser } from './userService';
import { syncEventMembers } from './eventService';
import {
  isLocalCalendarId,
  insertLocalCalendar,
  deleteLocalCalendar,
  updateLocalCalendarName,
  getAllLocalEvents,
  deleteAllLocalEvents,
  getLocalCalendars,
} from './localEventService';

const calendarsCol = collection(db, 'calendars');

export async function createCalendar(
  name: string,
  createdBy: string
): Promise<string> {
  const id = randomUUID();
  insertLocalCalendar(id, name, createdBy);
  await addCalendarToUser(createdBy, id);
  return id;
}

export async function getCalendar(calendarId: string): Promise<Calendar | null> {
  if (isLocalCalendarId(calendarId)) {
    const locals = getLocalCalendars();
    return locals.find((c) => c.id === calendarId) ?? null;
  }
  const snap = await getDoc(doc(db, 'calendars', calendarId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Calendar;
}

export async function joinCalendar(calendarId: string, uid: string): Promise<boolean> {
  if (isLocalCalendarId(calendarId)) {
    // ローカルカレンダーを共有化: Firestoreに移行
    const localCals = getLocalCalendars();
    const localCal = localCals.find((c) => c.id === calendarId);
    if (!localCal) return false;

    // Firestoreにカレンダードキュメントとイベントを移行
    const calRef = doc(db, 'calendars', calendarId);
    const members = [localCal.createdBy, uid];
    const localEvents = getAllLocalEvents(calendarId);

    // 500件制限を考慮してバッチ分割（カレンダードキュメント分で+1）
    const BATCH_LIMIT = 499;
    const firstBatch = writeBatch(db);
    firstBatch.set(calRef, {
      name: localCal.name,
      members,
      createdBy: localCal.createdBy,
      createdAt: serverTimestamp(),
    });

    let currentBatch = firstBatch;
    let batchCount = 1;
    const batches: ReturnType<typeof writeBatch>[] = [firstBatch];

    for (const event of localEvents) {
      if (batchCount >= BATCH_LIMIT) {
        currentBatch = writeBatch(db);
        batches.push(currentBatch);
        batchCount = 0;
      }
      const eventRef = doc(db, 'calendars', calendarId, 'events', event.id);
      currentBatch.set(eventRef, {
        title: event.title,
        type: event.type,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        hourlyWage: event.hourlyWage ?? null,
        color: event.color,
        createdBy: event.createdBy,
        createdAt: serverTimestamp(),
        members,
        recurrence: event.recurrence ?? null,
        externalId: event.externalId ?? null,
        externalProvider: event.externalProvider ?? null,
      });
      batchCount++;
    }

    for (const batch of batches) {
      await batch.commit();
    }

    // SQLiteからデータ削除
    deleteLocalCalendar(calendarId);
    await addCalendarToUser(uid, calendarId);
    return true;
  }

  const calRef = doc(db, 'calendars', calendarId);
  const snap = await getDoc(calRef);
  if (!snap.exists()) return false;

  const currentMembers: string[] = snap.data().members ?? [];
  const newMembers = [...currentMembers, uid];

  await updateDoc(calRef, { members: arrayUnion(uid) });
  await addCalendarToUser(uid, calendarId);

  // イベントの members を同期
  await syncEventMembers(calendarId, newMembers);
  return true;
}

export async function leaveCalendar(calendarId: string, uid: string): Promise<void> {
  if (isLocalCalendarId(calendarId)) {
    await removeCalendarFromUser(uid, calendarId);
    return;
  }

  const calRef = doc(db, 'calendars', calendarId);
  const snap = await getDoc(calRef);
  const currentMembers: string[] = snap.exists() ? (snap.data().members ?? []) : [];
  const newMembers = currentMembers.filter((m) => m !== uid);

  await updateDoc(calRef, { members: arrayRemove(uid) });
  await removeCalendarFromUser(uid, calendarId);

  // イベントの members を同期
  await syncEventMembers(calendarId, newMembers);
}

export async function removeMember(
  calendarId: string,
  memberUid: string,
  requestingUid: string
): Promise<boolean> {
  const cal = await getCalendar(calendarId);
  if (!cal || cal.createdBy !== requestingUid) return false;

  if (isLocalCalendarId(calendarId)) return false;

  const newMembers = cal.members.filter((m) => m !== memberUid);

  await updateDoc(doc(db, 'calendars', calendarId), {
    members: arrayRemove(memberUid),
  });
  await removeCalendarFromUser(memberUid, calendarId);

  // イベントの members を同期
  await syncEventMembers(calendarId, newMembers);
  return true;
}

export async function deleteCalendar(
  calendarId: string,
  requestingUid: string
): Promise<boolean> {
  if (isLocalCalendarId(calendarId)) {
    const localCals = getLocalCalendars();
    const cal = localCals.find((c) => c.id === calendarId);
    if (!cal || cal.createdBy !== requestingUid) return false;
    deleteLocalCalendar(calendarId);
    await removeCalendarFromUser(requestingUid, calendarId);
    return true;
  }

  const cal = await getCalendar(calendarId);
  if (!cal || cal.createdBy !== requestingUid) return false;

  await deleteDoc(doc(db, 'calendars', calendarId));
  for (const memberUid of cal.members) {
    await removeCalendarFromUser(memberUid, calendarId);
  }
  return true;
}

export function subscribeToCalendar(
  calendarId: string,
  callback: (calendar: Calendar | null) => void
): Unsubscribe {
  if (isLocalCalendarId(calendarId)) {
    const localCals = getLocalCalendars();
    const cal = localCals.find((c) => c.id === calendarId) ?? null;
    callback(cal);
    return () => {};
  }

  return onSnapshot(doc(db, 'calendars', calendarId), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as Calendar);
    } else {
      callback(null);
    }
  }, (error) => {
    console.warn('[subscribeToCalendar]', calendarId, error.code, error.message);
    callback(null);
  });
}

export async function updateCalendarName(
  calendarId: string,
  name: string
): Promise<void> {
  if (isLocalCalendarId(calendarId)) {
    updateLocalCalendarName(calendarId, name);
    return;
  }
  await updateDoc(doc(db, 'calendars', calendarId), { name });
}
