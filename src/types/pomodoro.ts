import { Timestamp } from 'firebase/firestore';

export interface PomodoroSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLongBreak: number;
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
};

export interface StudyRecord {
  id: string;
  subject: string;
  slotKey: string;
  timetableId: string;
  /** 勉強時間（分） */
  durationMinutes: number;
  date: string; // YYYY-MM-DD
  startedAt: Timestamp;
  completedAt: Timestamp;
}

export type StudyRecordInput = Omit<StudyRecord, 'id'>;

export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak';
