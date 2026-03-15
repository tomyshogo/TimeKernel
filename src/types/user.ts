import { Period } from './timetable';

export interface NightShiftSettings {
  enabled: boolean;
  startTime: string;
  multiplier: number;
}

export interface UserSettings {
  periods: Period[];
  nightShift: NightShiftSettings;
}

export interface UserProfile {
  name: string;
  email?: string;
  calendars: string[];
}

export const DEFAULT_NIGHT_SHIFT: NightShiftSettings = {
  enabled: true,
  startTime: '22:00',
  multiplier: 1.25,
};
