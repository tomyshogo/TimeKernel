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

  if (!(await isMember(calendarId, uid))) {
    throw new Error('User is not a member of this calendar');
  }

  const colorDefaults: Record<string, string> = {
    class: '#3498db',
    event: '#e74c3c',
    shift: '#2ecc71',
  };

  const docRef = await db.collection(`calendars/${calendarId}/events`).add({
    title: args.title,
    type: args.type,
    date: args.date,
    startTime: args.startTime,
    endTime: args.endTime,
    hourlyWage: args.hourlyWage || null,
    color: args.color || colorDefaults[args.type] || '#3498db',
    createdBy: uid,
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
  if (!(await isMember(args.calendarId, uid))) {
    throw new Error('User is not a member of this calendar');
  }

  const updateData: Record<string, unknown> = {};
  if (args.title !== undefined) updateData.title = args.title;
  if (args.date !== undefined) updateData.date = args.date;
  if (args.startTime !== undefined) updateData.startTime = args.startTime;
  if (args.endTime !== undefined) updateData.endTime = args.endTime;
  if (args.hourlyWage !== undefined) updateData.hourlyWage = args.hourlyWage;
  if (args.color !== undefined) updateData.color = args.color;

  await db
    .doc(`calendars/${args.calendarId}/events/${args.eventId}`)
    .update(updateData);
}

export async function deleteEvent(
  uid: string,
  args: { calendarId: string; eventId: string }
): Promise<void> {
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
