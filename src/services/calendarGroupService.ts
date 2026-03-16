import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { CalendarGroup, CalendarGroupInput, CalendarSettings } from '../types';

function groupsCol(uid: string) {
  return collection(db, 'users', uid, 'calendarGroups');
}

function settingsCol(uid: string) {
  return collection(db, 'users', uid, 'calendarSettings');
}

// --- Calendar Groups ---

export async function createGroup(uid: string, input: CalendarGroupInput): Promise<string> {
  const docRef = await addDoc(groupsCol(uid), input);
  return docRef.id;
}

export async function updateGroup(
  uid: string,
  groupId: string,
  data: Partial<CalendarGroupInput>
): Promise<void> {
  await updateDoc(doc(groupsCol(uid), groupId), data);
}

export async function deleteGroup(uid: string, groupId: string): Promise<void> {
  await deleteDoc(doc(groupsCol(uid), groupId));
}

export function subscribeToGroups(
  uid: string,
  callback: (groups: CalendarGroup[]) => void
): Unsubscribe {
  return onSnapshot(
    query(groupsCol(uid), orderBy('order', 'asc')),
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CalendarGroup)));
    }
  );
}

// --- Calendar Settings ---

export async function setCalendarSettings(
  uid: string,
  calendarId: string,
  settings: Partial<CalendarSettings>
): Promise<void> {
  await setDoc(doc(settingsCol(uid), calendarId), settings, { merge: true });
}

export async function getAllCalendarSettings(uid: string): Promise<CalendarSettings[]> {
  const snap = await getDocs(settingsCol(uid));
  return snap.docs.map((d) => ({ calendarId: d.id, ...d.data() } as CalendarSettings));
}

export async function archiveCalendar(uid: string, calendarId: string): Promise<void> {
  await setCalendarSettings(uid, calendarId, { archived: true, visible: false });
}

export async function unarchiveCalendar(uid: string, calendarId: string): Promise<void> {
  await setCalendarSettings(uid, calendarId, { archived: false, visible: true });
}
