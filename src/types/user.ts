import { Period } from './timetable';

export interface NightShiftSettings {
  enabled: boolean;
  startTime: string;
  multiplier: number;
}

export interface NotificationSettings {
  /** 通知全体のON/OFF */
  enabled: boolean;
  /** イベントタイプ別ON/OFF */
  eventTypes: {
    class: boolean;
    event: boolean;
    shift: boolean;
  };
  /** リマインダー時間（分前）*/
  reminderMinutes: number;
  /** おやすみ時間 */
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string;   // HH:MM
  };
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  eventTypes: {
    class: true,
    event: true,
    shift: true,
  },
  reminderMinutes: 10,
  quietHours: {
    enabled: false,
    start: '23:00',
    end: '07:00',
  },
};

export interface UserSettings {
  periods: Period[];
  nightShift: NightShiftSettings;
  notifications: NotificationSettings;
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
