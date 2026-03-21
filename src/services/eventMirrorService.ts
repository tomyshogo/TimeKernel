/**
 * ローカルイベントをFirestoreにミラーリング（Alexa連携用）
 * alexaSync が有効な場合のみ動作
 */

import {
  doc,
  setDoc,
  deleteDoc,
  collection,
} from 'firebase/firestore';
import { db } from './firebase';
import { CalendarEventInput } from '../types';

const mirrorCol = (uid: string) => collection(db, 'users', uid, 'eventMirror');

export async function mirrorEvent(
  uid: string,
  calendarId: string,
  eventId: string,
  event: CalendarEventInput
): Promise<void> {
  await setDoc(doc(mirrorCol(uid), eventId), {
    ...event,
    calendarId,
    mirroredAt: new Date().toISOString(),
  });
}

export async function updateMirrorEvent(
  uid: string,
  eventId: string,
  data: Partial<CalendarEventInput>
): Promise<void> {
  await setDoc(doc(mirrorCol(uid), eventId), {
    ...data,
    mirroredAt: new Date().toISOString(),
  }, { merge: true });
}

export async function deleteMirrorEvent(
  uid: string,
  eventId: string
): Promise<void> {
  try {
    await deleteDoc(doc(mirrorCol(uid), eventId));
  } catch {}
}
