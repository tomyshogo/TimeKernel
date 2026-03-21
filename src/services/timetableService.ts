import { randomUUID } from 'expo-crypto';
import { getDatabase } from './localDatabase';
import { Timetable, TimetableInput, TimetableSlot } from '../types';

// --- Change notification ---
type Listener = (timetables: Timetable[]) => void;
const listeners: Set<Listener> = new Set();

function notifyChange(): void {
  const all = getAllTimetablesSync();
  listeners.forEach((cb) => cb(all));
}

function rowToTimetable(row: any): Timetable {
  return {
    id: row.id,
    calendarId: row.calendarId ?? null,
    isPublic: row.isPublic === 1,
    slots: row.slots ? JSON.parse(row.slots) : {},
  };
}

function getAllTimetablesSync(): Timetable[] {
  const db = getDatabase();
  const rows = db.getAllSync('SELECT * FROM timetables') as any[];
  return rows.map(rowToTimetable);
}

export async function createTimetable(
  _uid: string,
  input: TimetableInput
): Promise<string> {
  const db = getDatabase();
  const id = randomUUID();
  db.runSync(
    'INSERT INTO timetables (id, calendarId, isPublic, slots) VALUES (?, ?, ?, ?)',
    [id, input.calendarId ?? null, input.isPublic ? 1 : 0, JSON.stringify(input.slots)]
  );
  notifyChange();
  return id;
}

export async function getTimetable(
  _uid: string,
  timetableId: string
): Promise<Timetable | null> {
  const db = getDatabase();
  const row = db.getFirstSync('SELECT * FROM timetables WHERE id = ?', [timetableId]) as any;
  return row ? rowToTimetable(row) : null;
}

export async function getAllTimetables(_uid: string): Promise<Timetable[]> {
  return getAllTimetablesSync();
}

export async function updateTimetable(
  _uid: string,
  timetableId: string,
  data: Partial<TimetableInput>
): Promise<void> {
  const db = getDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  if ('calendarId' in data) {
    fields.push('calendarId = ?');
    values.push(data.calendarId ?? null);
  }
  if ('isPublic' in data) {
    fields.push('isPublic = ?');
    values.push(data.isPublic ? 1 : 0);
  }
  if ('slots' in data) {
    fields.push('slots = ?');
    values.push(JSON.stringify(data.slots));
  }

  if (fields.length === 0) return;
  values.push(timetableId);
  db.runSync(`UPDATE timetables SET ${fields.join(', ')} WHERE id = ?`, values);
  notifyChange();
}

export async function updateSlot(
  _uid: string,
  timetableId: string,
  slotKey: string,
  slot: TimetableSlot | null
): Promise<void> {
  const db = getDatabase();
  const row = db.getFirstSync('SELECT slots FROM timetables WHERE id = ?', [timetableId]) as any;
  if (!row) return;

  const slots = JSON.parse(row.slots || '{}');
  if (slot === null) {
    delete slots[slotKey];
  } else {
    slots[slotKey] = slot;
  }

  db.runSync('UPDATE timetables SET slots = ? WHERE id = ?', [JSON.stringify(slots), timetableId]);
  notifyChange();
}

export async function deleteTimetable(
  _uid: string,
  timetableId: string
): Promise<void> {
  const db = getDatabase();
  db.runSync('DELETE FROM timetables WHERE id = ?', [timetableId]);
  notifyChange();
}

export function subscribeToTimetables(
  _uid: string,
  callback: (timetables: Timetable[]) => void
): () => void {
  // 初回データを即座に返す
  callback(getAllTimetablesSync());
  listeners.add(callback);
  return () => listeners.delete(callback);
}
