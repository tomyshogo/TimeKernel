import { db } from '../firebase';
import { MCPEvent, ShiftSummary } from '../types';

async function getUserCalendarIds(uid: string): Promise<string[]> {
  const userDoc = await db.doc(`users/${uid}`).get();
  if (!userDoc.exists) return [];
  return userDoc.data()?.calendars || [];
}

async function getEventsForCalendars(
  calendarIds: string[],
  dateFilter: { field: string; op: FirebaseFirestore.WhereFilterOp; value: string }[]
): Promise<MCPEvent[]> {
  const allEvents: MCPEvent[] = [];

  for (const calId of calendarIds) {
    let query: FirebaseFirestore.Query = db.collection(`calendars/${calId}/events`);
    for (const filter of dateFilter) {
      query = query.where(filter.field, filter.op, filter.value);
    }
    const snap = await query.orderBy('startTime').get();
    for (const doc of snap.docs) {
      const data = doc.data();
      allEvents.push({
        id: doc.id,
        calendarId: calId,
        title: data.title,
        type: data.type,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        hourlyWage: data.hourlyWage,
        color: data.color,
        createdBy: data.createdBy,
      });
    }
  }

  return allEvents.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });
}

export async function getTodayEvents(uid: string): Promise<MCPEvent[]> {
  const calendarIds = await getUserCalendarIds(uid);
  const today = new Date().toISOString().split('T')[0];
  return getEventsForCalendars(calendarIds, [
    { field: 'date', op: '==', value: today },
  ]);
}

export async function getEventsByDate(
  uid: string,
  date: string
): Promise<MCPEvent[]> {
  const calendarIds = await getUserCalendarIds(uid);
  return getEventsForCalendars(calendarIds, [
    { field: 'date', op: '==', value: date },
  ]);
}

export async function getEventsByRange(
  uid: string,
  startDate: string,
  endDate: string
): Promise<MCPEvent[]> {
  const calendarIds = await getUserCalendarIds(uid);
  return getEventsForCalendars(calendarIds, [
    { field: 'date', op: '>=', value: startDate },
    { field: 'date', op: '<=', value: endDate },
  ]);
}

export async function getFreeSlots(
  uid: string,
  startDate: string,
  endDate: string
): Promise<string[]> {
  const events = await getEventsByRange(uid, startDate, endDate);
  const busyDates = new Set(events.map((e) => e.date));

  const freeDates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    if (!busyDates.has(dateStr)) {
      freeDates.push(dateStr);
    }
    current.setDate(current.getDate() + 1);
  }

  return freeDates;
}

export async function getShiftSummary(
  uid: string,
  yearMonth: string
): Promise<ShiftSummary> {
  const calendarIds = await getUserCalendarIds(uid);
  const [year, month] = yearMonth.split('-').map(Number);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

  const events = await getEventsForCalendars(calendarIds, [
    { field: 'date', op: '>=', value: startDate },
    { field: 'date', op: '<', value: endDate },
  ]);

  const shifts = events.filter((e) => e.type === 'shift' && e.hourlyWage);
  let totalHours = 0;
  let totalPay = 0;

  for (const shift of shifts) {
    const [sh, sm] = shift.startTime.split(':').map(Number);
    const [eh, em] = shift.endTime.split(':').map(Number);
    let startMin = sh * 60 + sm;
    let endMin = eh * 60 + em;
    if (endMin <= startMin) endMin += 24 * 60;
    const hours = (endMin - startMin) / 60;
    totalHours += hours;
    totalPay += Math.round(hours * (shift.hourlyWage || 0));
  }

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    totalPay,
    shiftCount: shifts.length,
  };
}

export async function getCalendars(
  uid: string
): Promise<Array<{ id: string; name: string; memberCount: number }>> {
  const calendarIds = await getUserCalendarIds(uid);
  const result = [];

  for (const calId of calendarIds) {
    const doc = await db.doc(`calendars/${calId}`).get();
    if (doc.exists) {
      const data = doc.data()!;
      result.push({
        id: calId,
        name: data.name,
        memberCount: (data.members || []).length,
      });
    }
  }

  return result;
}

export async function getTimetable(uid: string): Promise<unknown[]> {
  const snap = await db.collection(`timetables/${uid}/items`).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
