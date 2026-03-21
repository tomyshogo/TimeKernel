import { db, admin } from '../firebase';

async function getUserCalendarIds(uid: string): Promise<string[]> {
  const userDoc = await db.doc(`users/${uid}`).get();
  if (!userDoc.exists) return [];
  return userDoc.data()?.calendars || [];
}

async function isMember(calendarId: string, uid: string): Promise<boolean> {
  const doc = await db.doc(`calendars/${calendarId}`).get();
  if (!doc.exists) return false;
  return (doc.data()?.members || []).includes(uid);
}

/**
 * カレンダーがFirestore上の共有カレンダーかローカルカレンダーかを判定
 * Firestoreに存在しなければローカルカレンダーと判断
 */
async function isSharedCalendar(calendarId: string): Promise<boolean> {
  const doc = await db.doc(`calendars/${calendarId}`).get();
  return doc.exists;
}

/**
 * ローカルカレンダー用のキューに書き込み
 * アプリ側がこのキューを監視してSQLiteに反映する
 */
async function enqueueForLocal(
  uid: string,
  action: 'add' | 'update' | 'delete',
  calendarId: string,
  eventData?: Record<string, unknown>,
  eventId?: string
): Promise<string> {
  const ref = db.collection(`users/${uid}/eventQueue`).doc();
  await ref.set({
    action,
    calendarId,
    eventId: eventId || null,
    eventData: eventData || null,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function addEvent(
  uid: string,
  args: {
    calendarId?: string;
    title: string;
    type: 'class' | 'event' | 'shift';
    date: string;
    startTime: string;
    endTime: string;
    hourlyWage?: number;
    color?: string;
  }
): Promise<{ id: string; calendarId: string }> {
  let calendarId = args.calendarId;

  if (!calendarId) {
    const calIds = await getUserCalendarIds(uid);
    if (calIds.length === 0) throw new Error('No calendars found for user');
    calendarId = calIds[0];
  }

  const colorDefaults: Record<string, string> = {
    class: '#3498db',
    event: '#e74c3c',
    shift: '#2ecc71',
  };

  const eventData = {
    title: args.title,
    type: args.type,
    date: args.date,
    startTime: args.startTime,
    endTime: args.endTime,
    hourlyWage: args.hourlyWage || null,
    color: args.color || colorDefaults[args.type] || '#3498db',
    createdBy: uid,
  };

  // ローカルカレンダーの場合はキューに書き込み
  if (!(await isSharedCalendar(calendarId))) {
    const queueId = await enqueueForLocal(uid, 'add', calendarId, eventData);
    return { id: queueId, calendarId };
  }

  // 共有カレンダーは直接Firestoreに書き込み
  const docRef = await db.collection(`calendars/${calendarId}/events`).add({
    ...eventData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { id: docRef.id, calendarId };
}

export async function updateEvent(
  uid: string,
  args: {
    calendarId: string;
    eventId: string;
    title?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    hourlyWage?: number;
    color?: string;
  }
): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (args.title !== undefined) updateData.title = args.title;
  if (args.date !== undefined) updateData.date = args.date;
  if (args.startTime !== undefined) updateData.startTime = args.startTime;
  if (args.endTime !== undefined) updateData.endTime = args.endTime;
  if (args.hourlyWage !== undefined) updateData.hourlyWage = args.hourlyWage;
  if (args.color !== undefined) updateData.color = args.color;

  // ローカルカレンダーの場合はキューに書き込み
  if (!(await isSharedCalendar(args.calendarId))) {
    await enqueueForLocal(uid, 'update', args.calendarId, updateData, args.eventId);
    return;
  }

  await db
    .doc(`calendars/${args.calendarId}/events/${args.eventId}`)
    .update(updateData);
}

export async function deleteEvent(
  uid: string,
  args: { calendarId: string; eventId: string }
): Promise<void> {
  // ローカルカレンダーの場合はキューに書き込み
  if (!(await isSharedCalendar(args.calendarId))) {
    await enqueueForLocal(uid, 'delete', args.calendarId, undefined, args.eventId);
    return;
  }

  const eventDoc = await db
    .doc(`calendars/${args.calendarId}/events/${args.eventId}`)
    .get();

  if (!eventDoc.exists) throw new Error('Event not found');
  if (eventDoc.data()?.createdBy !== uid) {
    throw new Error('Only the creator can delete this event');
  }

  await eventDoc.ref.delete();
}

export async function addShift(
  uid: string,
  args: {
    calendarId?: string;
    date: string;
    startTime: string;
    endTime: string;
    hourlyWage: number;
    title?: string;
  }
): Promise<{ id: string; calendarId: string }> {
  return addEvent(uid, {
    calendarId: args.calendarId,
    title: args.title || 'バイト',
    type: 'shift',
    date: args.date,
    startTime: args.startTime,
    endTime: args.endTime,
    hourlyWage: args.hourlyWage,
    color: '#2ecc71',
  });
}
