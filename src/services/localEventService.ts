import { randomUUID } from 'expo-crypto';
import { getDatabase } from './localDatabase';
import { CalendarEvent, CalendarEventInput, RecurrenceRule } from '../types';
import { Calendar } from '../types';
import { mirrorEvent, updateMirrorEvent, deleteMirrorEvent } from './eventMirrorService';
import { useAuthStore } from '../stores/authStore';

// --- Alexa sync helper ---
function shouldMirror(): { enabled: boolean; uid: string | null } {
  try {
    const state = useAuthStore.getState();
    return {
      enabled: state.settings?.alexaSync === true,
      uid: state.uid,
    };
  } catch {
    return { enabled: false, uid: null };
  }
}

// --- Change notification ---
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function onLocalEventsChanged(callback: Listener): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyChange(): void {
  listeners.forEach((cb) => cb());
}

// --- Calendar CRUD ---

export function getLocalCalendars(): Calendar[] {
  const db = getDatabase();
  const rows = db.getAllSync('SELECT * FROM calendars') as any[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    members: [r.createdBy],
    createdBy: r.createdBy,
    createdAt: null as any,
  }));
}

export function insertLocalCalendar(id: string, name: string, createdBy: string): void {
  const db = getDatabase();
  db.runSync(
    'INSERT INTO calendars (id, name, createdBy, createdAt) VALUES (?, ?, ?, ?)',
    [id, name, createdBy, new Date().toISOString()]
  );
}

export function updateLocalCalendarName(calendarId: string, name: string): void {
  const db = getDatabase();
  db.runSync('UPDATE calendars SET name = ? WHERE id = ?', [name, calendarId]);
}

export function deleteLocalCalendar(calendarId: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM events WHERE calendarId = ?', [calendarId]);
  db.runSync('DELETE FROM calendars WHERE id = ?', [calendarId]);
  notifyChange();
}

export function isLocalCalendarId(calendarId: string): boolean {
  const db = getDatabase();
  const row = db.getFirstSync('SELECT id FROM calendars WHERE id = ?', [calendarId]) as any;
  return !!row;
}

// --- Event CRUD ---

function rowToEvent(row: any): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    date: row.date,
    endDate: row.endDate ?? undefined,
    isAllDay: row.isAllDay === 1 ? true : undefined,
    startTime: row.startTime ?? '',
    endTime: row.endTime ?? '',
    hourlyWage: row.hourlyWage ?? undefined,
    color: row.color,
    createdBy: row.createdBy,
    createdAt: null as any,
    calendarId: row.calendarId,
    members: [row.createdBy],
    recurrence: row.recurrence ? JSON.parse(row.recurrence) as RecurrenceRule : undefined,
    externalId: row.externalId ?? undefined,
    externalProvider: row.externalProvider ?? undefined,
  };
}

export function addLocalEvent(calendarId: string, event: CalendarEventInput): string {
  const db = getDatabase();
  const id = randomUUID();
  db.runSync(
    `INSERT INTO events (id, title, type, date, endDate, isAllDay, startTime, endTime, hourlyWage, color, createdBy, createdAt, calendarId, recurrence, externalId, externalProvider)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      event.title,
      event.type,
      event.date,
      event.endDate ?? null,
      event.isAllDay ? 1 : 0,
      event.startTime ?? null,
      event.endTime ?? null,
      event.hourlyWage ?? null,
      event.color,
      event.createdBy,
      new Date().toISOString(),
      calendarId,
      event.recurrence ? JSON.stringify(event.recurrence) : null,
      event.externalId ?? null,
      event.externalProvider ?? null,
    ]
  );
  notifyChange();

  // Alexaミラーリング（非同期、エラーでもブロックしない）
  setTimeout(() => {
    try {
      const sync = shouldMirror();
      if (sync.enabled && sync.uid) {
        mirrorEvent(sync.uid, calendarId, id, event).catch((e) => console.warn('[Mirror] add error:', e));
      }
    } catch {}
  }, 0);

  return id;
}

export function updateLocalEvent(
  calendarId: string,
  eventId: string,
  data: Partial<CalendarEventInput>
): void {
  const db = getDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  const fieldMap: Record<string, string> = {
    title: 'title',
    type: 'type',
    date: 'date',
    endDate: 'endDate',
    startTime: 'startTime',
    endTime: 'endTime',
    hourlyWage: 'hourlyWage',
    color: 'color',
    createdBy: 'createdBy',
    externalId: 'externalId',
    externalProvider: 'externalProvider',
  };

  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in data) {
      fields.push(`${col} = ?`);
      values.push((data as any)[key] ?? null);
    }
  }

  if ('recurrence' in data) {
    fields.push('recurrence = ?');
    values.push(data.recurrence ? JSON.stringify(data.recurrence) : null);
  }

  if ('isAllDay' in data) {
    fields.push('isAllDay = ?');
    values.push(data.isAllDay ? 1 : 0);
  }

  if (fields.length === 0) return;

  values.push(eventId, calendarId);
  db.runSync(
    `UPDATE events SET ${fields.join(', ')} WHERE id = ? AND calendarId = ?`,
    values
  );
  notifyChange();

  setTimeout(() => {
    try {
      const sync = shouldMirror();
      if (sync.enabled && sync.uid) {
        updateMirrorEvent(sync.uid, eventId, data).catch((e) => console.warn('[Mirror] update error:', e));
      }
    } catch {}
  }, 0);
}

export function deleteLocalEvent(calendarId: string, eventId: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM events WHERE id = ? AND calendarId = ?', [eventId, calendarId]);
  notifyChange();

  setTimeout(() => {
    try {
      const sync = shouldMirror();
      if (sync.enabled && sync.uid) {
        deleteMirrorEvent(sync.uid, eventId).catch((e) => console.warn('[Mirror] delete error:', e));
      }
    } catch {}
  }, 0);
}

// --- Queries ---

export function getLocalEventsByMonth(calendarIds: string[], yearMonth: string): CalendarEvent[] {
  if (calendarIds.length === 0) return [];
  const db = getDatabase();
  const [year, month] = yearMonth.split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

  const placeholders = calendarIds.map(() => '?').join(',');
  const rows = db.getAllSync(
    `SELECT * FROM events WHERE calendarId IN (${placeholders})
     AND ((date >= ? AND date < ?) OR (endDate IS NOT NULL AND date < ? AND endDate >= ?))
     ORDER BY date, startTime`,
    [...calendarIds, startDate, endDate, endDate, startDate]
  ) as any[];

  return rows.map(rowToEvent);
}

export function getLocalEventsByDate(calendarIds: string[], date: string): CalendarEvent[] {
  if (calendarIds.length === 0) return [];
  const db = getDatabase();
  const placeholders = calendarIds.map(() => '?').join(',');
  const rows = db.getAllSync(
    `SELECT * FROM events WHERE calendarId IN (${placeholders})
     AND (date = ? OR (endDate IS NOT NULL AND date <= ? AND endDate >= ?))
     ORDER BY startTime`,
    [...calendarIds, date, date, date]
  ) as any[];

  return rows.map(rowToEvent);
}

export function getLocalEventById(calendarId: string, eventId: string): CalendarEvent | null {
  const db = getDatabase();
  const row = db.getFirstSync(
    'SELECT * FROM events WHERE id = ? AND calendarId = ?',
    [eventId, calendarId]
  ) as any;
  return row ? rowToEvent(row) : null;
}

export function getLocalExternalEventIds(
  calendarId: string,
  provider: string
): Map<string, string> {
  const db = getDatabase();
  const rows = db.getAllSync(
    'SELECT id, externalId FROM events WHERE calendarId = ? AND externalProvider = ? AND externalId IS NOT NULL',
    [calendarId, provider]
  ) as any[];
  const map = new Map<string, string>();
  for (const r of rows) {
    map.set(r.externalId, r.id);
  }
  return map;
}

export function getAllLocalEvents(calendarId: string): CalendarEvent[] {
  const db = getDatabase();
  const rows = db.getAllSync(
    'SELECT * FROM events WHERE calendarId = ?',
    [calendarId]
  ) as any[];
  return rows.map(rowToEvent);
}

export function deleteAllLocalEvents(calendarId: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM events WHERE calendarId = ?', [calendarId]);
  notifyChange();
}
