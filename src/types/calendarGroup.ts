export interface CalendarGroup {
  id: string;
  name: string;
  order: number;
  calendarIds: string[];
}

export type CalendarGroupInput = Omit<CalendarGroup, 'id'>;

export interface CalendarSettings {
  calendarId: string;
  order: number;
  archived: boolean;
  groupId: string | null;
  visible: boolean;
}

export type EventVisibility = 'public' | 'title_only' | 'private';
