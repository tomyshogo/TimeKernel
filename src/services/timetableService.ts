import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { Timetable, TimetableInput, TimetableSlot } from '../types';

function timetablesCol(uid: string) {
  return collection(db, 'timetables', uid, 'items');
}

export async function createTimetable(
  uid: string,
  input: TimetableInput
): Promise<string> {
  const docRef = await addDoc(timetablesCol(uid), input);
  return docRef.id;
}

export async function getTimetable(
  uid: string,
  timetableId: string
): Promise<Timetable | null> {
  const snap = await getDoc(doc(db, 'timetables', uid, 'items', timetableId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Timetable;
}

export async function getAllTimetables(uid: string): Promise<Timetable[]> {
  const snap = await getDocs(timetablesCol(uid));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Timetable);
}

export async function updateTimetable(
  uid: string,
  timetableId: string,
  data: Partial<TimetableInput>
): Promise<void> {
  await updateDoc(doc(db, 'timetables', uid, 'items', timetableId), data);
}

export async function updateSlot(
  uid: string,
  timetableId: string,
  slotKey: string,
  slot: TimetableSlot | null
): Promise<void> {
  if (slot === null) {
    await updateDoc(doc(db, 'timetables', uid, 'items', timetableId), {
      [`slots.${slotKey}`]: null,
    });
  } else {
    await updateDoc(doc(db, 'timetables', uid, 'items', timetableId), {
      [`slots.${slotKey}`]: slot,
    });
  }
}

export async function deleteTimetable(
  uid: string,
  timetableId: string
): Promise<void> {
  await deleteDoc(doc(db, 'timetables', uid, 'items', timetableId));
}

export function subscribeToTimetables(
  uid: string,
  callback: (timetables: Timetable[]) => void
): Unsubscribe {
  return onSnapshot(timetablesCol(uid), (snapshot) => {
    const timetables = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Timetable
    );
    callback(timetables);
  });
}
