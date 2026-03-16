import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { ExternalCalendar, ExternalEventMap } from '../types';

const externalCalendarsRef = (uid: string) =>
  collection(db, 'users', uid, 'externalCalendars');

const externalEventMapRef = (uid: string) =>
  collection(db, 'users', uid, 'externalEventMap');

// ── External Calendars CRUD ──

export async function getExternalCalendars(uid: string): Promise<ExternalCalendar[]> {
  const snap = await getDocs(externalCalendarsRef(uid));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExternalCalendar));
}

export async function addExternalCalendar(
  uid: string,
  calendar: Omit<ExternalCalendar, 'id'>
): Promise<string> {
  const ref = doc(externalCalendarsRef(uid));
  await setDoc(ref, calendar);
  return ref.id;
}

export async function updateExternalCalendar(
  uid: string,
  calendarId: string,
  data: Partial<ExternalCalendar>
): Promise<void> {
  await updateDoc(doc(externalCalendarsRef(uid), calendarId), data);
}

export async function deleteExternalCalendar(
  uid: string,
  calendarId: string
): Promise<void> {
  await deleteDoc(doc(externalCalendarsRef(uid), calendarId));
  // 関連するマッピングも削除
  const maps = await getExternalEventMaps(uid);
  for (const m of maps.filter((m) => m.calendarId === calendarId)) {
    await deleteDoc(doc(externalEventMapRef(uid), m.id));
  }
}

// ── External Event Map CRUD ──

export async function getExternalEventMaps(uid: string): Promise<ExternalEventMap[]> {
  const snap = await getDocs(externalEventMapRef(uid));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExternalEventMap));
}

export async function upsertExternalEventMap(
  uid: string,
  map: Omit<ExternalEventMap, 'id'>
): Promise<string> {
  // 既存のマッピングを検索
  const maps = await getExternalEventMaps(uid);
  const existing = maps.find(
    (m) => m.externalId === map.externalId && m.provider === map.provider
  );
  if (existing) {
    await updateDoc(doc(externalEventMapRef(uid), existing.id), {
      ...map,
      lastSynced: Timestamp.now(),
    });
    return existing.id;
  }
  const ref = doc(externalEventMapRef(uid));
  await setDoc(ref, { ...map, lastSynced: Timestamp.now() });
  return ref.id;
}

export async function updateSyncTimestamp(
  uid: string,
  externalCalendarId: string
): Promise<void> {
  await updateDoc(doc(externalCalendarsRef(uid), externalCalendarId), {
    lastSynced: Timestamp.now(),
  });
}
