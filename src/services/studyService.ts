import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { StudyRecord, StudyRecordInput } from '../types';

function studyCol(uid: string) {
  return collection(db, 'study', uid, 'records');
}

export async function addStudyRecord(
  uid: string,
  input: StudyRecordInput
): Promise<string> {
  const docRef = await addDoc(studyCol(uid), input);
  return docRef.id;
}

export async function getStudyRecords(
  uid: string,
  startDate: string,
  endDate: string
): Promise<StudyRecord[]> {
  const snap = await getDocs(
    query(
      studyCol(uid),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudyRecord));
}

export interface StudySummary {
  totalMinutes: number;
  bySubject: Record<string, number>;
}

export function summarizeStudyRecords(records: StudyRecord[]): StudySummary {
  const bySubject: Record<string, number> = {};
  let totalMinutes = 0;

  for (const r of records) {
    totalMinutes += r.durationMinutes;
    bySubject[r.subject] = (bySubject[r.subject] || 0) + r.durationMinutes;
  }

  return { totalMinutes, bySubject };
}
