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
} from 'firebase/firestore';
import { db } from './firebase';
import { Calendar } from '../types';
import { addCalendarToUser, removeCalendarFromUser } from './userService';
import { syncEventMembers } from './eventService';

const calendarsCol = collection(db, 'calendars');

export async function createCalendar(
  name: string,
  createdBy: string
): Promise<string> {
  const docRef = await addDoc(calendarsCol, {
    name,
    members: [createdBy],
    createdBy,
    createdAt: serverTimestamp(),
  });
  await addCalendarToUser(createdBy, docRef.id);
  return docRef.id;
}

export async function getCalendar(calendarId: string): Promise<Calendar | null> {
  const snap = await getDoc(doc(db, 'calendars', calendarId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Calendar;
}

export async function joinCalendar(calendarId: string, uid: string): Promise<boolean> {
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
  await updateDoc(doc(db, 'calendars', calendarId), { name });
}
