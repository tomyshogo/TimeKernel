import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, UserSettings, DEFAULT_NIGHT_SHIFT, DEFAULT_NOTIFICATION_SETTINGS } from '../types';
import { DEFAULT_PERIODS } from '../types/timetable';
import { DEFAULT_WEATHER_SETTINGS } from '../types/weather';

const usersRef = (uid: string) => doc(db, 'users', uid);
const settingsRef = (uid: string) => doc(db, 'users', uid, 'settings', 'general');

export async function getOrCreateUser(
  uid: string,
  name?: string
): Promise<{ profile: UserProfile; isNewUser: boolean }> {
  const snap = await getDoc(usersRef(uid));
  if (snap.exists()) {
    return { profile: snap.data() as UserProfile, isNewUser: false };
  }

  const profile: UserProfile = {
    name: name || '',
    calendars: [],
  };
  await setDoc(usersRef(uid), profile);

  const settings: UserSettings = {
    periods: DEFAULT_PERIODS,
    nightShift: DEFAULT_NIGHT_SHIFT,
    notifications: DEFAULT_NOTIFICATION_SETTINGS,
    weather: DEFAULT_WEATHER_SETTINGS,
  };
  await setDoc(settingsRef(uid), settings);

  return { profile, isNewUser: true };
}

export async function updateUserName(uid: string, name: string): Promise<void> {
  await updateDoc(usersRef(uid), { name });
}

export async function updateUserEmail(uid: string, email: string): Promise<void> {
  await updateDoc(usersRef(uid), { email });
}

export async function getUserSettings(uid: string): Promise<UserSettings> {
  const snap = await getDoc(settingsRef(uid));
  if (snap.exists()) {
    return snap.data() as UserSettings;
  }
  return {
    periods: DEFAULT_PERIODS,
    nightShift: DEFAULT_NIGHT_SHIFT,
    notifications: DEFAULT_NOTIFICATION_SETTINGS,
    weather: DEFAULT_WEATHER_SETTINGS,
  };
}

export async function updateUserSettings(
  uid: string,
  settings: Partial<UserSettings>
): Promise<void> {
  await updateDoc(settingsRef(uid), settings);
}

export async function addCalendarToUser(uid: string, calendarId: string): Promise<void> {
  await updateDoc(usersRef(uid), { calendars: arrayUnion(calendarId) });
}

export async function removeCalendarFromUser(uid: string, calendarId: string): Promise<void> {
  await updateDoc(usersRef(uid), { calendars: arrayRemove(calendarId) });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(usersRef(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}
